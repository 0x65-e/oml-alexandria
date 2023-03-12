"use strict";
exports.__esModule = true;
exports.OMLWriter = void 0;
var fs_1 = require("fs");
var OMLWriter = /** @class */ (function () {
    function OMLWriter() {
        this.uml_program = [];
        this.indent = 0;
        this.ip = 0;
        this.terminate = false;
        this.file_path = "";
    }
    OMLWriter.prototype.run = function (uml_program, file_name) {
        this.uml_program = uml_program;
        this.file_path = file_name.replace("examples", "scripts\\diagrams").replace(".oml", ".plantuml");
        if ((0, fs_1.existsSync)(this.file_path)) {
            (0, fs_1.truncateSync)(this.file_path);
        }
        while (!this.terminate) {
            this.write_line();
        }
    };
    OMLWriter.prototype.write_line = function () {
        var _this = this;
        for (var i = 0; i < this.indent; i++) {
            (0, fs_1.appendFileSync)(this.file_path, "   ");
        }
        this.uml_program[this.ip].forEach(function (entry) {
            if (entry.indexOf("{")) {
                _this.indent -= 1;
            }
            if (entry.indexOf("}")) {
                _this.indent += 1;
            }
            (0, fs_1.appendFileSync)(_this.file_path, entry + " ");
        });
        (0, fs_1.appendFileSync)(this.file_path, "\n");
        this.ip += 1;
        if (this.ip >= this.uml_program.length) {
            this.terminate = true;
        }
    };
    return OMLWriter;
}());
exports.OMLWriter = OMLWriter;
