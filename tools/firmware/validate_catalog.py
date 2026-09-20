#!/usr/bin/env python3
"""Validate QtPi firmware catalogs and every repository-hosted artifact."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[2]
FIRMWARE = ROOT / "firmware"
RAW_PATH_PREFIX = "/QtLearnCodeLab/qtpi-shared/main/"
errors: list[str] = []


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
        check_artifact(url, version.get("sha256"), version.get("sizeBytes"), "/".join(key))
    return keys


def validate_release(url: str, key: tuple[str, str, str]) -> None:
    path = local_path(url)
    if path is None or not path.is_file():
        fail(f"{'/'.join(key)}: missing release descriptor")
        return
    release = load(path)
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
    sums = path.parent / "SHA256SUMS"
    if not sums.is_file():
        fail(f"{path.relative_to(ROOT)}: SHA256SUMS is missing")
    else:
        expected = {f"{image['sha256']}  {image['file']}" for image in images}
        actual = {line.strip() for line in sums.read_text(encoding="utf-8").splitlines() if line.strip()}
        if actual != expected:
            fail(f"{sums.relative_to(ROOT)}: entries do not match release.json")


def validate_latest(url: str, board_id: str, flavor_id: str, default_version: str) -> None:
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


def validate_v2(catalog: dict, v1_keys: set[tuple[str, str, str]]) -> None:
    if catalog.get("schemaVersion") != 2:
        fail("firmware/manifest-v2.json: schemaVersion must be 2")
    v2_keys: set[tuple[str, str, str]] = set()
    checked_latest: set[tuple[str, str]] = set()
    for board_id, flavor_id, flavor, version in iter_versions(catalog):
        key = (board_id, flavor_id, version.get("version"))
        v2_keys.add(key)
        images = version.get("images", [])
        if not images:
            fail(f"{'/'.join(key)}: v2 release has no images")
        for image in images:
            check_artifact(
                image.get("downloadUrl", ""),
                image.get("sha256"),
                image.get("sizeBytes"),
                "/".join(key),
            )
        release_url = version.get("releaseUrl")
        if release_url:
            validate_release(release_url, key)
        flavor_key = (board_id, flavor_id)
        if flavor.get("latestUrl") and flavor_key not in checked_latest:
            validate_latest(flavor["latestUrl"], board_id, flavor_id, flavor["defaultVersion"])
            checked_latest.add(flavor_key)
    if v2_keys != v1_keys:
        fail("manifest v1 and v2 publish different board/flavor/version sets")


def main() -> int:
    for schema in sorted((FIRMWARE / "schema").glob("*.json")):
        load(schema)
    v1_keys = validate_v1(load(FIRMWARE / "manifest.json"))
    validate_v2(load(FIRMWARE / "manifest-v2.json"), v1_keys)
    if errors:
        for error in errors:
            print(f"[ERROR] {error}", file=sys.stderr)
        return 1
    print(f"[OK] firmware catalog validated: {len(v1_keys)} releases")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
