"use strict";
exports.__esModule = true;
exports.OMLtoUMLInterpreter = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var OMLWriter_1 = require("./OMLWriter");
var OMLInterpreter_1 = require("./OMLInterpreter");
var OMLtoUMLInterpreter = /** @class */ (function () {
    function OMLtoUMLInterpreter() {
        this.file_path = (0, path_1.join)(__dirname, '..', 'examples', 'dungeons.oml');
        this.file_name = this.file_path.split("/").pop();
        this.oml_file = (0, fs_1.readFileSync)(this.file_path, 'utf8');
        this.tokenized_program = this.tokenize_program();
    }
    OMLtoUMLInterpreter.prototype.tokenize_program = function () {
        var tokenized_program = [];
        var line_list = [];
        var oml_list = this.oml_file.split("\n");
        oml_list.forEach(function (line) {
            line = line.trim();
            line_list = line.length > 0 ? line.split(" ") : [];
            if (line_list.length > 0) {
                tokenized_program.push(line_list);
            }
        });
        return tokenized_program;
    };
    OMLtoUMLInterpreter.prototype.remove_comment = function (line) {
        if (line.indexOf("//") > 0) {
            var index = line.indexOf("//");
            return line.slice(0, index);
        }
        if (line.indexOf("@rdfs:comment") > 0) {
            var index = line.indexOf("@rdfs:comment");
            return line.slice(0, index);
        }
        return line;
    };
    return OMLtoUMLInterpreter;
}());
exports.OMLtoUMLInterpreter = OMLtoUMLInterpreter;
var interpreter = new OMLtoUMLInterpreter();
var tokenized_prorgam = interpreter.tokenized_program;
var oml_interpreter = new OMLInterpreter_1.Interpreter();
var uml_program = oml_interpreter.run(tokenized_prorgam);
//console.log(uml_program)
var uml_writer = new OMLWriter_1.OMLWriter();
uml_writer.run(uml_program, interpreter.file_name);
