#!/usr/bin/env python3
"""Validate QtPi firmware catalogs and every repository-hosted artifact."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[2]
FIRMWARE = ROOT / "firmware"
RAW_PATH_PREFIX = "/QtLearnCodeLab/qtpi-shared/main/"
errors: list[str] = []
VERSIONED_PATH = re.compile(r"^firmware/(?:[^/]+/)+v\d+\.\d+\.\d+/")


def fail(message: str) -> None:
    errors.append(message)


def load(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"{path.relative_to(ROOT)}: {exc}")
        return {}


def local_path(url: str) -> Path | None:
    parsed = urlparse(url)
    if parsed.netloc != "raw.githubusercontent.com" or not parsed.path.startswith(RAW_PATH_PREFIX):
        fail(f"unsupported artifact URL: {url}")
        return None
    path = (ROOT / parsed.path[len(RAW_PATH_PREFIX) :]).resolve()
    if ROOT not in path.parents:
        fail(f"artifact URL escapes repository: {url}")
        return None
    return path


def digest(path: Path) -> str:
    result = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def validate_schema(instance: dict, schema_path: Path, label: str) -> None:
    try:
        import jsonschema
    except ImportError:
        fail("jsonschema is required; install tools/firmware/requirements.txt")
        return
    schema = load(schema_path)
    try:
        jsonschema.Draft202012Validator.check_schema(schema)
        jsonschema.validate(instance, schema)
    except jsonschema.exceptions.SchemaError as exc:
        fail(f"{schema_path.relative_to(ROOT)}: invalid schema: {exc.message}")
    except jsonschema.exceptions.ValidationError as exc:
        location = "/".join(str(part) for part in exc.absolute_path) or "<root>"
        fail(f"{label}:{location}: {exc.message}")


def validate_ranges(images: list[dict], label: str, container_size: int | None = None) -> None:
    ranges: list[tuple[int, int, str]] = []
    for image in images:
        if "offset" not in image:
            continue
        try:
            start = int(image["offset"], 16)
            size = int(image["sizeBytes"])
        except (KeyError, TypeError, ValueError):
            fail(f"{label}: invalid image offset or size")
            continue
        end = start + size
        if start < 0 or size <= 0:
            fail(f"{label}: image ranges must be positive")
        if container_size is not None and end > container_size:
            fail(f"{label}: {image.get('role')} exceeds its containing image")
        ranges.append((start, end, image.get("role", "unknown")))
    ranges.sort()
    for previous, current in zip(ranges, ranges[1:]):
        if current[0] < previous[1]:
            fail(f"{label}: {previous[2]} overlaps {current[2]}")


def check_artifact(url: str, expected_sha: str, expected_size: int, label: str) -> None:
    path = local_path(url)
    if path is None:
        return
    if not path.is_file():
        fail(f"{label}: missing {path.relative_to(ROOT)}")
        return
    if path.stat().st_size != expected_size:
        fail(f"{label}: size is {path.stat().st_size}, expected {expected_size}")
    actual_sha = digest(path)
    if actual_sha != expected_sha:
        fail(f"{label}: SHA-256 is {actual_sha}, expected {expected_sha}")


def iter_versions(catalog: dict):
    board_ids: set[str] = set()
    for board in catalog.get("boards", []):
        board_id = board.get("boardId")
        if board_id in board_ids:
            fail(f"duplicate boardId: {board_id}")
        board_ids.add(board_id)
        flavor_ids: set[str] = set()
        for flavor in board.get("flavors", []):
            flavor_id = flavor.get("flavorId")
            if flavor_id in flavor_ids:
                fail(f"{board_id}: duplicate flavorId: {flavor_id}")
            flavor_ids.add(flavor_id)
            versions = flavor.get("versions", [])
            names = [version.get("version") for version in versions]
            if len(names) != len(set(names)):
                fail(f"{board_id}/{flavor_id}: duplicate versions")
            if flavor.get("defaultVersion") not in names:
                fail(f"{board_id}/{flavor_id}: defaultVersion is not published")
            for version in versions:
                yield board_id, flavor_id, flavor, version


def validate_v1(catalog: dict) -> set[tuple[str, str, str]]:
    if catalog.get("schemaVersion") != 1:
        fail("firmware/manifest.json: schemaVersion must be 1")
    keys: set[tuple[str, str, str]] = set()
    for board_id, flavor_id, _flavor, version in iter_versions(catalog):
        name = version.get("version")
        key = (board_id, flavor_id, name)
        keys.add(key)
        url = version.get("downloadUrl", "")
        if "/latest/" in url:
            fail(f"{'/'.join(key)}: v1 downloadUrl must be immutable")
        if f"/v{name}/" not in url:
            fail(f"{'/'.join(key)}: v1 downloadUrl must use its version directory")
        check_artifact(url, version.get("sha256"), version.get("sizeBytes"), "/".join(key))
    return keys


def validate_release(url: str, key: tuple[str, str, str], catalog_images: list[dict]) -> None:
    path = local_path(url)
    if path is None or not path.is_file():
        fail(f"{'/'.join(key)}: missing release descriptor")
        return
    release = load(path)
    validate_schema(release, FIRMWARE / "schema/release-v1.schema.json", str(path.relative_to(ROOT)))
    if release.get("schemaVersion") != 1:
        fail(f"{path.relative_to(ROOT)}: schemaVersion must be 1")
    if tuple(release.get(field) for field in ("boardId", "flavorId", "version")) != key:
        fail(f"{path.relative_to(ROOT)}: identity does not match catalog")
    images = release.get("images", [])
    if not images:
        fail(f"{path.relative_to(ROOT)}: no images")
    for image in images:
        artifact = path.parent / image.get("file", "")
        if not artifact.is_file():
            fail(f"{path.relative_to(ROOT)}: missing image {artifact.name}")
            continue
        if artifact.stat().st_size != image.get("sizeBytes") or digest(artifact) != image.get("sha256"):
            fail(f"{path.relative_to(ROOT)}: image metadata mismatch for {artifact.name}")
        contained = image.get("contains", [])
        if contained:
            validate_ranges(contained, f"{path.relative_to(ROOT)}:{artifact.name}", image.get("sizeBytes"))
            for sub in contained:
                if "file" in sub:
                    sub_file = path.parent / sub["file"]
                    if not sub_file.is_file():
                        fail(f"{path.relative_to(ROOT)}: missing contained file {sub['file']}")
                    elif sub.get("sizeBytes") and sub_file.stat().st_size != sub["sizeBytes"]:
                        fail(f"{path.relative_to(ROOT)}: size mismatch for {sub['file']}")
                    elif sub.get("sha256") and digest(sub_file) != sub["sha256"]:
                        fail(f"{path.relative_to(ROOT)}: SHA-256 mismatch for {sub['file']}")
    artifacts = release.get("artifacts", [])
    for artifact in artifacts:
        artifact_file = path.parent / artifact.get("file", "")
        if not artifact_file.is_file():
            fail(f"{path.relative_to(ROOT)}: missing artifact {artifact_file.name}")
            continue
        if artifact_file.stat().st_size != artifact.get("sizeBytes"):
            fail(f"{path.relative_to(ROOT)}: size mismatch for {artifact_file.name}")
        if digest(artifact_file) != artifact.get("sha256"):
            fail(f"{path.relative_to(ROOT)}: SHA-256 mismatch for {artifact_file.name}")
    validate_ranges(images, str(path.relative_to(ROOT)))
    expected_tag_flavor = {"firmata-dual": "firmata", "micropython": "micropython"}.get(key[1])
    if expected_tag_flavor:
        expected_tag = f"qtpi-esp32-{expected_tag_flavor}-v{key[2]}"
        if release.get("source", {}).get("tag") != expected_tag:
            fail(f"{path.relative_to(ROOT)}: source tag must be {expected_tag}")
    catalog_by_name = {Path(urlparse(image["downloadUrl"]).path).name: image for image in catalog_images}
    for image in images:
        catalog_image = catalog_by_name.get(image.get("file"))
        if not catalog_image:
            fail(f"{path.relative_to(ROOT)}: {image.get('file')} is absent from manifest-v2")
            continue
        for field in ("role", "offset", "sha256", "sizeBytes"):
            if image.get(field) != catalog_image.get(field):
                fail(f"{path.relative_to(ROOT)}: {field} disagrees with manifest-v2")
    sums = path.parent / "SHA256SUMS"
    if not sums.is_file():
        fail(f"{path.relative_to(ROOT)}: SHA256SUMS is missing")
    else:
        expected = {f"{image['sha256']}  {image['file']}" for image in images}
        for image in images:
            for sub in image.get("contains", []):
                if "sha256" in sub and "file" in sub:
                    expected.add(f"{sub['sha256']}  {sub['file']}")
        for artifact in artifacts:
            expected.add(f"{artifact['sha256']}  {artifact['file']}")
        actual = {line.strip() for line in sums.read_text(encoding="utf-8").splitlines() if line.strip()}
        if actual != expected:
            fail(f"{sums.relative_to(ROOT)}: entries do not match release.json")


def validate_latest(
    url: str, board_id: str, flavor_id: str, default_version: str, expected_release_url: str
) -> None:
    path = local_path(url)
    if path is None or not path.is_file():
        fail(f"{board_id}/{flavor_id}: missing latest.json")
        return
    latest = load(path)
    expected = (board_id, flavor_id, default_version)
    if tuple(latest.get(field) for field in ("boardId", "flavorId", "version")) != expected:
        fail(f"{path.relative_to(ROOT)}: identity does not match defaultVersion")
    release_path = local_path(latest.get("releaseUrl", ""))
    if release_path is None or not release_path.is_file():
        fail(f"{path.relative_to(ROOT)}: releaseUrl does not exist")
    if latest.get("releaseUrl") != expected_release_url:
        fail(f"{path.relative_to(ROOT)}: releaseUrl does not match the default release")
    if release_path is None or not release_path.is_file():
        return
    release = load(release_path)
    complete_images = [
        image for image in release.get("images", []) if image.get("role") == "complete"
    ]
    mirror_dir = path.parent / "latest"
    expected_names = {image.get("file") for image in complete_images}
    actual_names = (
        {item.name for item in mirror_dir.glob("*.bin")} if mirror_dir.is_dir() else set()
    )
    if actual_names != expected_names:
        fail(
            f"{mirror_dir.relative_to(ROOT)}: latest binary mirror contains "
            f"{sorted(actual_names)}, expected {sorted(expected_names)}"
        )
    for image in complete_images:
        mirror = mirror_dir / image["file"]
        if mirror.is_file() and (
            mirror.stat().st_size != image.get("sizeBytes")
            or digest(mirror) != image.get("sha256")
        ):
            fail(f"{mirror.relative_to(ROOT)}: latest mirror does not match release descriptor")


def validate_v2(catalog: dict, v1_keys: set[tuple[str, str, str]]) -> None:
    if catalog.get("schemaVersion") != 2:
        fail("firmware/manifest-v2.json: schemaVersion must be 2")
    validate_schema(catalog, FIRMWARE / "schema/manifest-v2.schema.json", "firmware/manifest-v2.json")
    v2_keys: set[tuple[str, str, str]] = set()
    checked_latest: set[tuple[str, str]] = set()
    for board_id, flavor_id, flavor, version in iter_versions(catalog):
        key = (board_id, flavor_id, version.get("version"))
        v2_keys.add(key)
        images = version.get("images", [])
        if not images:
            fail(f"{'/'.join(key)}: v2 release has no images")
        for image in images:
            if f"/v{key[2]}/" not in image.get("downloadUrl", ""):
                fail(f"{'/'.join(key)}: image URL must use its version directory")
            check_artifact(
                image.get("downloadUrl", ""),
                image.get("sha256"),
                image.get("sizeBytes"),
                "/".join(key),
            )
            for sub in image.get("contains", []):
                if sub.get("downloadUrl"):
                    if f"/v{key[2]}/" not in sub["downloadUrl"]:
                        fail(f"{'/'.join(key)}: contained image URL must use its version directory")
                    check_artifact(
                        sub["downloadUrl"],
                        sub.get("sha256"),
                        sub.get("sizeBytes"),
                        f"{'/'.join(key)}:{sub.get('role')}",
                    )
        validate_ranges(images, "/".join(key))
        release_url = version.get("releaseUrl")
        if release_url:
            if f"/v{key[2]}/" not in release_url:
                fail(f"{'/'.join(key)}: releaseUrl must use its version directory")
            validate_release(release_url, key, images)
        flavor_key = (board_id, flavor_id)
        if flavor.get("latestUrl") and flavor_key not in checked_latest:
            default_release = next(
                (item.get("releaseUrl", "") for item in flavor.get("versions", []) if item.get("version") == flavor["defaultVersion"]),
                "",
            )
            validate_latest(
                flavor["latestUrl"], board_id, flavor_id, flavor["defaultVersion"], default_release
            )
            checked_latest.add(flavor_key)
    if v2_keys != v1_keys:
        fail("manifest v1 and v2 publish different board/flavor/version sets")


def validate_immutability(base_ref: str) -> None:
    try:
        subprocess.check_call(
            ["git", "rev-parse", "--verify", f"{base_ref}^{{commit}}"],
            cwd=ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        changed = subprocess.check_output(
            ["git", "diff", "--name-only", f"{base_ref}...HEAD"], cwd=ROOT, text=True
        ).splitlines()
    except subprocess.CalledProcessError:
        fail(f"cannot resolve immutability base ref: {base_ref}")
        return
    checked_dirs: set[str] = set()
    for name in changed:
        match = VERSIONED_PATH.match(name)
        if not match:
            continue
        version_dir = match.group(0).rstrip("/")
        if version_dir in checked_dirs:
            continue
        checked_dirs.add(version_dir)
        existed_files = subprocess.check_output(
            ["git", "ls-tree", "-r", "--name-only", base_ref, "--", version_dir],
            cwd=ROOT,
            text=True,
        ).splitlines()
        for changed_file in changed:
            if changed_file in existed_files and changed_file.endswith((".bin", ".hex")):
                introduction_commits = subprocess.check_output(
                    [
                        "git",
                        "log",
                        "--diff-filter=A",
                        "--format=%H",
                        base_ref,
                        "--",
                        changed_file,
                    ],
                    cwd=ROOT,
                    text=True,
                ).splitlines()
                if not introduction_commits:
                    fail(f"cannot find original publication for immutable binary: {changed_file}")
                    continue
                original_commit = introduction_commits[-1]
                original_blob = subprocess.check_output(
                    ["git", "rev-parse", f"{original_commit}:{changed_file}"],
                    cwd=ROOT,
                    text=True,
                ).strip()
                current_blob = subprocess.check_output(
                    ["git", "hash-object", str(ROOT / changed_file)],
                    cwd=ROOT,
                    text=True,
                ).strip()
                if current_blob != original_blob:
                    fail(f"immutable published binary differs from original: {changed_file}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-ref", help="reject changes to version directories present at this ref")
    args = parser.parse_args()
    for schema in sorted((FIRMWARE / "schema").glob("*.json")):
        load(schema)
    v1_keys = validate_v1(load(FIRMWARE / "manifest.json"))
    validate_v2(load(FIRMWARE / "manifest-v2.json"), v1_keys)
    if args.base_ref:
        validate_immutability(args.base_ref)
    if errors:
        for error in errors:
            print(f"[ERROR] {error}", file=sys.stderr)
        return 1
    print(f"[OK] firmware catalog validated: {len(v1_keys)} releases")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
