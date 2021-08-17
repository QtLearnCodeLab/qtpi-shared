/*! qad.js v1.0.3 June 28, 2021 */
(function (f) {
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;
    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }
    g.p5js = f();
  }
})(function () {
  var define, module, exports;
  return (function () {
    function r (e, n, t) {
      function o (i, f) {
        if (!n[i]) {
          if (!e[i]) {
            var c = "function" == typeof require && require;
            if (!f && c) return c(i, !0);
            if (u) return u(i, !0);
            var a = new Error("Cannot find module '" + i + "'");
            throw ((a.code = "MODULE_NOT_FOUND"), a);
          }
          var p = (n[i] = { exports: {} });
          e[i][0].call(
            p.exports,
            function (r) {
              var n = e[i][1][r];
              return o(n || r);
            },
            p,
            p.exports,
            r,
            e,
            n,
            t
          );
        }
        return n[i].exports;
      }
      for (
        var u = "function" == typeof require && require, i = 0;
        i < t.length;
        i++
      )
        o(t[i]);
      return o;
    }
    return r;
  })()(
    {
      1: [
        function (_dereq_, module, exports) {
          /**
           * @module Basic constructors
           */
          /*jshint esversion: 6 */

          "use strict";

          var utils = _dereq_("./lib/socket_utils.js");
          var special = _dereq_("./lib/special_methods_index.js");
          var modeError =
            "Please check mode. Value should be 'analog', 'digital', 'pwm', or servo"; // jshint ignore:line

          /**
           * This is the primary constructor for the board object. It stores the
           * port and type, makes constants available, and initializes the queue.
           * It is called by p5.board.
           *
           * @param {String} port The port to which the microcontroller is connected
           * @param {String} type Type of microcontroller
           */
          var Board = function (port, type) {
            this.port = port;
            this.type = type.toLowerCase() || "arduino";

            // Will be set when board is connected
            this.ready = false;
            this.eventQ = [];

            this.pinsArray = [];

            // Constants
            this.HIGH = "high";
            this.LOW = "low";

            this.INPUT = "input";
            this.OUTPUT = "output";

            this.ANALOG = "analog";
            this.DIGITAL = "digital";
            this.PWM = "pwm";
            this.SERVO = "servo";

            this.BUTTON = "button";
            this.KNOCK = "knock";
            this.LED = "led";
            this.MOTOR = "motor";
            this.PIEZO = "piezo";
            this.RGBLED = "rgbled";
            this.TEMP = "temp";
            this.TONE = "tone";
            this.VRES = "vres";
            this.callbacks = {};
          };

          Board.prototype.registerCb = function (name, callBack) {
            console.log("Board registerCb  ", name, callBack);
            var cbArray = this.callbacks[name];
            if (cbArray == null) {
              cbArray = [];
              this.callbacks[name] = cbArray;
            }
            cbArray.indexOf(callBack) === -1
              ? cbArray.push(callBack)
              : console.log("This item already exists");
          };

          /**
           * The Pin constructor sets pin defaults and parses for special,
           * or complex, modes
           *
           * @param {Number} num         Pin number on the board
           * @param {String} [mode]      Pin mode: can be basic or complex
           * @param {String} [direction] Input or output
           */
          var Pin = function (num, mode, direction) {
            this.pin = num;
            this.direction = direction ? direction.toLowerCase() : "output";

            this.mode = mode ? mode.toLowerCase() : "digital";

            this.write = function () {
              throw new Error("Write undefined");
            };
            this.read = function () {
              throw new Error("Read undefined");
            };
          };

          /**
           * Instantiaties pin, directs construction of helper methods
           * based on mode
           *
           * @param {Number} num         Pin number on the board
           * @param {String} [mode]      Pin mode: can be basic or complex
           * @param {String} [direction] Input or output
           * @return {Object}            Instantiated pin
           */
          Board.prototype.pin = function (num, mode, direction) {
            //console.log('inside pin prototype');
            var _pin = new Pin(num, mode, direction);

            if (_pin.mode === "digital" || _pin.mode === "analog") {
              utils.dispatch(
                utils.pinInit(_pin.pin, _pin.mode, _pin.direction)
              );
              utils.constructFuncs(_pin);
            } else if (_pin.mode === "pwm") {
              utils.dispatch(
                utils.pinInit(_pin.pin, _pin.mode, _pin.direction)
              );
              utils.constructFuncs(_pin, "analog");
            } else {
              throw new Error(modeError);
            }

            this.pinsArray.push(_pin);

            return _pin;
          };

          /**
           * The Ports constructor
           *
           */
          var Ports = function (boardType) {
            if (boardType) {
              this.boardType = boardType;
            }
          };

          Board.prototype.ports = function () {
            //console.log('inside port prototype');
            var _ports = new Ports(this.type);
            utils.constructPortFuncs(_ports);
            return _ports;
          };

          /**
           * p5.board() makes the board object accessible via p5.
           * It must be called to begin communicating with the board
           * for all methods but p5.serial.
           *
           * @param {String} port The port to which the microcontroller is connected
           * @param {String} type Type of microcontroller
           * @return {Object}     Reference to the object as stored in utils.
           *
           */
          p5.board = function (port, type, connectcb, disconnectcb) {
            console.log("P5 BOARD", port, type);
            utils.board = new Board(port, type);

            // emit board object & listen for return
            utils.boardInit(port, type);
            //utils.socket.on('board ready', function (data) {
            utils.board.ready = true;
            connectcb && connectcb(utils.board);
            console.log(" board ready board.analogPins ", data);
            utils.board.eventQ.forEach(function (el) {
              el.func.apply(null, el.args);
            });
            //});

            // utils.socket.on('board disconnect', function () {
            //   console.log('board disconnect event from server ');
            //   utils.board.ready = false;
            //   disconnectcb && disconnectcb();
            // });

            return utils.board;
          };

          /**
           * Initializes the serial methods on the base p5 object.
           * Serial does not pass through firmata & therefore not through
           * board & pin constructors
           *
           * @type {function}
           */
          p5.serial = special.serial;
        },
        { "./lib/socket_utils.js": 9, "./lib/special_methods_index.js": 10 },
      ],
      2: [function (_dereq_, module, exports) { }, { "./socket_utils.js": 9 }],
      3: [function (_dereq_, module, exports) { }, { "./socket_utils.js": 9 }],
      4: [function (_dereq_, module, exports) { }, { "./socket_utils.js": 9 }],
      5: [function (_dereq_, module, exports) { }, { "./socket_utils.js": 9 }],
      6: [function (_dereq_, module, exports) { }, { "./socket_utils.js": 9 }],
      7: [
        function (_dereq_, module, exports) {
          var utils = _dereq_("./socket_utils.js"),
            socket = utils.socket,
            serialObj = {};

          /**
           * Serial does not work along the same methods as Firmata-dependent
           * board funcs. It is therefore attached to the top-level p5 Object.
           *
           * @return {Object} Constructed serial instance
           */
          var serial = function () {
            /**
             * Passes through data to a node-serialport instatiation
             * @param  {String} path   Port used
             * @param  {Object} config Config options, can use any listed
             *                         for node-serialport
             */
            serialObj.connect = function (path, config, cb) {
              console.log(
                "serial.js connect method",
                "path",
                path,
                "config",
                config,
                "callback",
                cb
              );
              var data = {
                path: path,
                callback: cb,
                config: config,
              };
              //socket.emit('serial init', data);
              console.log("emitted data init", data);
            };

            serialObj.close = function (cb) {
              console.log(
                "serial.js close method",
                "serial",
                serial,
                "callback",
                cb
              );
              var data = {
                callback: cb,
              };
              //socket.emit('serial close', data);
              console.log("emitted close event data init", data);
            };

            serialObj.read = function (cb) {
              //socket.emit('serial read');
              // socket.on('serial read return', function (data) {
              //   serialObj.data = data;
              //   cb(data);
              // });
            };

            // Read-event aliases for the old-school among us.
            serialObj.readEvent = serialObj.read;
            serialObj.readData = function () {
              return this.data;
            };

            serialObj.write = function (arg, cb) {
              // socket.emit('serial write', { arg: arg });
              // socket.on('serial write return', function (data) {
              //   cb && cb(data);
              // });
            };

            serialObj.list = function (cb) {
              console.log("emits serial list");
              // socket.emit('serial list');
              // socket.on('serial list return', function (data) {
              //   if (cb) {
              //     cb(data.ports);
              //   }
              // });
            };
            return serialObj;
          };

          module.exports = serial;
        },
        { "./socket_utils.js": 9 },
      ],
      8: [function (_dereq_, module, exports) { }, { "./socket_utils.js": 9 }],
      9: [
        function (_dereq_, module, exports) {
          /*jshint esversion: 6 */
          var socket = {}; //io.connect('http://localhost:8000/sensors');
          // socket.on('error', function (err) {
          //   console.log(err);
          // });

          var utils = {
            boardInit: function (port, type) {
              // Board should always immediately fire
              console.log("boardInit emitting board object", type, port);
              // socket.emit('board object', {
              //   board: type,
              //   port: port,
              // });
            },

            // Set by p5.board
            board: undefined,

            /**
             * Workhorse function establishes default ports & pins for all
             * @param  {Object} ports    Base ports instance
             * @return {Object}        Mutated ports
             */
            constructPortFuncs: function (ports) {
              ports.list = function (callback) {
                console.log("ports.list called", ports.boardType);
                var args = {
                  boardtype: ports.boardType,
                };
                // socket.emit('ports', args);
                // socket.on('return ports', function (data) {
                //   callback && callback(data);
                // });
              };

              ports.analogPins = function (num, callback) {
                var args = {
                  num: num,
                  boardtype: ports.boardType,
                };
                // socket.emit('analog pins', args);
                // socket.on('return analog pins', function (data) {
                //   console.log('return analog pins', data);
                //   callback && callback(data);
                // });
              };

              ports.digitalPins = function (num, callback) {
                var args = {
                  num: num,
                  boardtype: ports.boardType,
                };
                // socket.emit('digital pins', args);
                // socket.on('return digital pins', function (data) {
                //   console.log('return ports.digitalPins', data);
                //   callback && callback(data);
                // });
              };

              ports.motorPins = function (num, callback) {
                var data = {
                  num: num,
                  boardtype: ports.boardType,
                };
                console.log("ports.motor");
                // socket.emit('motor pins', data);
                // socket.on('return motor pins', function (value) {
                //   console.log('return ports.motor', data);
                //   callback && callback(value);
                // });
              };

              ports.usbPins = function (num, callback) {
                var args = {
                  num: num,
                  boardtype: ports.boardType,
                };
                console.log("ports.usb");
                // socket.emit('usb pins', args);
                // socket.on('return usb pins', function (data) {
                //   console.log('return ports.usb', data);
                //   callback && callback(data);
                // });
              };
              return ports;
            },

            /**
             * Workhorse function establishes default read & write for all
             * pins that don't override
             *
             * @param  {Object} pin    Base pin instance
             * @param  {String} [mode] Explicit mode override
             * @return {Object}        Mutated pin
             */
            constructFuncs: function (pin, mode) {
              var mode = mode || pin.mode; // jshint ignore:line

              function setVal (data) {
                // Callbacks set in socketGen for generic read
                // & in special constructors for special
                this.readcb && this.readcb(data.val);
                this.val = data.val;

                utils.readTests[this.special] &&
                  utils.readTests[this.special].call(this, data.val);
              }

              pin.read = function (arg) {
                console.log("pin.read", arg);
                var fire = utils.socketGen(mode, "read", pin);
                utils.dispatch(fire, arg);
                //socket.on('return val' + pin.pin, setVal.bind(this));
                return function nextRead (arg) {
                  fire(arg);
                };
              };

              pin.write = function (arg) {
                var fire = utils.socketGen(mode, "write", pin);
                utils.dispatch(fire, arg);
                return function nextWrite (arg) {
                  fire(arg);
                };
              };

              function sendValue (data) {
                //console.log('sendValue called');
                this.sysexStringCb && this.sysexStringCb(data);
              }
              pin.sendSysex = function (arg, string_cb) {
                if (string_cb) {
                  this.sysexStringCb = string_cb;
                }
                console.log("pin.sendSysex", arg);
                var fire = utils.socketGen(mode, "send_sysex", pin);
                utils.dispatch(fire, arg);
                //socket.on('sysex string', sendValue.bind(this));
                return function nextWriteSysex (arg) {
                  fire(arg);
                };
              };

              return pin;
            },

            dispatch: function (fn, arg) {
              this.board.ready
                ? fn(arg)
                : this.board.eventQ.push({ func: fn, args: [arg] });
            },

            pinInit: function (pin, mode, direction) {
              return function emitPin () {
                // socket.emit('pin object', {
                //   pin: pin,
                //   mode: mode.toLowerCase(),
                //   direction: direction.toLowerCase()
                // });
              };
            },

            socket: socket,

            /**
             * Generates generic read and write funcs and emits
             * across the socket
             *
             * @param  {String} kind      digital | analog
             * @param  {String} direction input | output
             * @param  {Number} pin       pin number on board, analog pins can
             *                            just pass the number without A
             *
             */
            map: { 4: "0", 5: "0", 6: "0", 7: "0" },
            M1: { pin1: -1, pin2: -1 },
            M2: { pin1: -1, pin2: -1 },

            socketGen: function (kind, direction, pin) {
              // function titleCase (str) {
              //   return str.charAt(0).toUpperCase() + str.substring(1);
              // }
              // return function action (arg) {
              //   if (direction === 'read') {
              //     pin.readcb = arg;
              //   }

              //   utils.map[pin.pin] = arg;
              //   console.log("MAP HERE=>", utils.map);
              //   // simulate(map);

              //   console.log('action emit ', direction, arg, pin);
              //   // socket.emit('action', {
              //   //   action: kind + titleCase(direction),
              //   //   pin: pin.pin,
              //   //   type: direction,
              //   //   arg: arg
              //   // });
              // };
              function titleCase (str) {
                return str.charAt(0).toUpperCase() + str.substring(1);
              }

              function resetMotorPins () {
                utils.M1 = { pin1: -1, pin2: -1 };
                utils.M2 = { pin1: -1, pin2: -1 };
              }
              function run () {


                if (utils.M1["pin1"] < 0 || utils.M1["pin2"] < 0 || utils.M2["pin1"] < 0 || utils.M2["pin2"] < 0) {
                  //return to wait for other calls
                  return;
                }
                console.log("qtsim ====> run");
                console.table(utils.M1, utils.M2);

                if (utils.M1["pin2"] == 0 && utils.M2["pin1"] > 0) { //clockwise M1
                  //clockwise utils.M1
                  if (utils.M1["pin1"] > 0 && utils.M2["pin2"] == 0) { //clockwise utils.M2
                    //forward
                    var event = new CustomEvent("motor", { detail: "forward" });
                    window.dispatchEvent(event);
                    resetMotorPins();
                  } else if (utils.M1["pin1"] == 0 && utils.M2["pin2"] == 0) { //stop m2
                    //stop utils.M2
                    //forward left
                    var event = new CustomEvent("motor", { detail: "left" });
                    console.log("EVENT DISPATCH ->", event);
                    window.dispatchEvent(event);
                    resetMotorPins();
                  }
                } else if (utils.M1["pin1"] > 0 && utils.M1["pin2"] == 0) { //anti clockwise
                  if (utils.M2["pin1"] == 0 && utils.M2["pin2"] == 0) { // anti clockwise 
                    //right
                    var event = new CustomEvent("motor", { detail: "right" });
                    console.log("EVENT DISPATCH ->", event);
                    window.dispatchEvent(event);
                    resetMotorPins();
                  } 
                } else if (utils.M2["pin1"] == 0 && utils.M2["pin2"] == 0) {//stop
                  if (utils.M1["pin1"] == 0 && utils.M1["pin2"] == 0) { //stop
                    var event = new CustomEvent("motor", { detail: "stop" });
                    console.log("EVENT DISPATCH ->", event);
                    window.dispatchEvent(event);
                    resetMotorPins();
                  }
                }
              }
              return function action (arg) {
                if (direction === "read") {
                  pin.readcb = arg;
                }
                console.log("action emit ", direction, arg);
                if (direction == "write") {
                  //looking for motor write
                  console.table("WRITE ===> ", utils.board);
                  if (utils.board.type === "veda") {
                    switch (pin.pin) {
                      case 4:
                        utils.M1["pin1"] = arg;
                        run();
                        break;
                      case 5:
                        utils.M1["pin2"] = arg;
                        run();
                        break;
                      case 7:
                        utils.M2["pin1"] = arg;
                        run();
                        break;
                      case 6:
                        utils.M2["pin2"] = arg;
                        run();
                        break;
                      default:
                        break;
                    }
                  } else if (utils.board.type === "veda-esp32") {
                    switch (pin.pin) {
                      case 5:
                        utils.M1["pin1"] = arg;
                        run();
                        break;
                      case 13:
                        utils.M1["pin2"] = arg;
                        run();
                        break;
                      case 18:
                        utils.M2["pin1"] = arg;
                        run();
                        break;
                      case 19:
                        utils.M2["pin2"] = arg;
                        run();
                        break;
                      default:
                        break;
                    }
                  }
                }
                // socket.emit('action', {
                // action: kind + titleCase(direction),
                // pin: pin.pin,
                // type: direction,
                // arg: arg
                // });
              };
            },
          };

          module.exports = utils;
        },
        {},
      ],
      10: [
        function (_dereq_, module, exports) {
          // Don't forget to add new files to this sweet table of contents
          var special = {
            serial: _dereq_("./serial.js"),
          };
          module.exports = special;
        },
        { "./serial.js": 7 },
      ],
      11: [function (_dereq_, module, exports) { }, { "./socket_utils.js": 9 }],
      12: [function (_dereq_, module, exports) { }, { "./socket_utils.js": 9 }],
    },
    {},
    [1]
  )(1);
});
