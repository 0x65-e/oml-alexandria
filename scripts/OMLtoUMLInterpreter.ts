import { readFileSync } from "fs";
import { join } from "path";
import { OMLWriter } from "./OMLWriter";
import { Interpreter } from "./OMLInterpreter";

export class OMLtoUMLInterpreter {
    file_path = join(__dirname, "..", "examples", "dungeons.oml");
    file_name = this.file_path.split("/").pop();
    oml_file = readFileSync(this.file_path, "utf8");

    public tokenize_program() {
        let tokenized_program: string[][] = [];
        let line_list: string[] = [];
        let oml_list = this.oml_file.split("\n");
        oml_list.forEach((line) => {
            line = line.trim();
            line_list = line.length > 0 ? line.split(" ") : [];
            if (line_list.length > 0) {
                tokenized_program.push(line_list);
            }
        });
        return tokenized_program;
    }

    public remove_comment(line) {
        if (line.indexOf("//") > 0) {
            let index = line.indexOf("//");
            return line.slice(0, index);
        }
        if (line.indexOf("@rdfs:comment") > 0) {
            let index = line.indexOf("@rdfs:comment");
            return line.slice(0, index);
        }
        return line;
    }
    tokenized_program = this.tokenize_program();
}
var interpreter = new OMLtoUMLInterpreter();
let tokenized_prorgam = interpreter.tokenized_program;

var oml_interpreter = new Interpreter();
let uml_program = oml_interpreter.run(tokenized_prorgam);

//console.log(uml_program)

var uml_writer = new OMLWriter();
uml_writer.run(uml_program, interpreter.file_name);
