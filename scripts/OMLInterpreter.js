"use strict";
exports.__esModule = true;
exports.Interpreter = void 0;
var Interpreter = /** @class */ (function () {
    function Interpreter() {
        this.tokenized_program = [];
        this.uml_program = [];
        this.terminate = false;
        this.ip = 0;
        this.dict = { "contains": "o--", "isContainedBy": "--o" };
    }
    Interpreter.prototype.run = function (tokenized_program) {
        this.tokenized_program = tokenized_program;
        this.setup_environemt();
        while (this.terminate == false) {
            this.process_line();
        }
        return this.uml_program;
    };
    Interpreter.prototype.setup_environemt = function () {
        var env_ip = this.ip;
        var terminate = false;
        while (!terminate) {
            var line = this.tokenized_program[env_ip];
            switch (line[0]) {
                case "vocabulary":
                    this.uml_program.push(["@startuml"]);
                    this.uml_program.push(["package", line[3], "{"]);
                    break;
                case "concept":
                    this.uml_program.push(["class", line[1]]);
                    break;
                case "aspect":
                    this.uml_program.push(["abstract", "class", line[1]]);
                    break;
            }
            env_ip++;
            if (env_ip >= this.tokenized_program.length) {
                terminate = true;
            }
        }
    };
    Interpreter.prototype.process_line = function () {
        var _this = this;
        var line = this.tokenized_program[this.ip];
        switch (line[0]) {
            case "concept":
                if (line.indexOf("[") > 0) {
                    this.restrict_property(line[1]);
                    line.pop();
                }
                if (line.indexOf(":>") > 0) {
                    var arg_list = line.slice(3);
                    arg_list.forEach(function (arg) {
                        _this.uml_program.push([line[1], "--|>", arg.replace(",", "")]);
                    });
                }
                break;
            case "aspect":
                if (line.indexOf("[") > 0) {
                    this.restrict_property(line[1]);
                    line.pop();
                }
                if (line.indexOf(":>") > 0) {
                    var arg_list = line.slice(3);
                    arg_list.forEach(function (arg) {
                        _this.uml_program.push([line[1], "--|>", arg.replace(",", "")]);
                    });
                }
                break;
            case "relation":
                var from_line = this.tokenized_program[this.ip + 1];
                var to_line = this.tokenized_program[this.ip + 2];
                var forward_line = this.tokenized_program[this.ip + 3].indexOf("forward") > -1 ? this.tokenized_program[this.ip + 3] : [];
                if (line.indexOf("Contains") > 0) {
                    this.uml_program.push([from_line[1], this.dict[forward_line[1]], to_line[1]]);
                }
                if (line.indexOf("Performs") > 0) {
                    var func_name = forward_line.indexOf("performs") > 0 ? to_line[1] : from_line[1];
                    var class_name = forward_line.indexOf("isPerformedBy") > 0 ? to_line[1] : from_line[1];
                    this.parse_function(func_name, class_name);
                }
                break;
            case "scalar":
                if (line[1] == "property") {
                    var property = line[2];
                    var class_name = this.tokenized_program[this.ip + 1][1];
                    var scalar = this.tokenized_program[this.ip + 2][1];
                    this.parse_property(property, class_name, scalar);
                }
                break;
            case "}":
                this.uml_program.push(["}"]);
                this.uml_program.push(["@enduml"]);
                break;
            default:
                break;
        }
        this.advance_statement();
    };
    Interpreter.prototype.advance_statement = function () {
        this.ip += 1;
        if (this.ip >= this.tokenized_program.length) {
            this.terminate = true;
        }
    };
    Interpreter.prototype.parse_function = function (func_name, class_name) {
        var class_index = -1;
        var func_index = -1;
        for (var i = 0; i < this.uml_program.length; i++) {
            if (this.uml_program[i].indexOf("class") > 0 && this.uml_program[i].indexOf(func_name) > 0) {
                func_index = i;
            }
            if (this.uml_program[i].indexOf("class") > 0 && this.uml_program[i].indexOf(class_name) > 0) {
                class_index = i;
            }
        }
        this.uml_program.splice(func_index, 1);
        if (this.uml_program[class_index].indexOf("{") > 0) {
            this.uml_program.splice(class_index + 1, 0, ["", "", "", func_name]);
        }
        else {
            this.uml_program[class_index].push("{");
            this.uml_program.splice(class_index + 1, 0, ["", "", "", func_name]);
            this.uml_program.splice(class_index + 2, 0, ["}"]);
        }
    };
    Interpreter.prototype.parse_property = function (property, class_name, scalar) {
        var class_index = -1;
        for (var i = 0; i < this.uml_program.length; i++) {
            if (this.uml_program[i].indexOf("class") >= 0 && this.uml_program[i].indexOf(class_name) > 0) {
                class_index = i;
            }
        }
        if (this.uml_program[class_index].indexOf("{") > 0) {
            this.uml_program.splice(class_index + 1, 0, ["", "", "", property + ":", scalar]);
        }
        else {
            this.uml_program[class_index].push("{");
            this.uml_program.splice(class_index + 1, 0, ["", "", "", property + ":", scalar]);
            this.uml_program.splice(class_index + 2, 0, ["}"]);
        }
    };
    Interpreter.prototype.restrict_property = function (class_name) {
        var property_ip = this.ip + 1;
        var class_index = -1;
        for (var i = 0; i < this.uml_program.length; i++) {
            if (this.uml_program[i].indexOf("class") >= 0 && this.uml_program[i].indexOf(class_name) > 0) {
                class_index = i;
            }
        }
        while (this.tokenized_program[property_ip].indexOf("restricts") == 0) {
            var property = this.tokenized_program[property_ip][3];
            var value = this.tokenized_program[property_ip].at(-1);
            value = this.find_cardinality(value, this.tokenized_program[property_ip]);
            if (this.uml_program[class_index].indexOf("{") > 0 && value) {
                this.uml_program.splice(class_index + 1, 0, ["", "", "", property + ":", value]);
            }
            else if (value) {
                this.uml_program[class_index].push("{");
                this.uml_program.splice(class_index + 1, 0, ["", "", "", property + ":", value]);
                this.uml_program.splice(class_index + 2, 0, ["}"]);
            }
            property_ip++;
        }
    };
    Interpreter.prototype.find_cardinality = function (value, line) {
        if (line.indexOf("exactly") >= 0) {
            value = "[" + value + "]";
        }
        if (line.indexOf("min") >= 0) {
            value = "[" + value + ":]";
        }
        if (line.indexOf("max") >= 0) {
            value = "[:" + value + "]";
        }
        return value;
    };
    return Interpreter;
}());
exports.Interpreter = Interpreter;
