import {truncateSync, appendFileSync, existsSync} from "fs"

export class OMLWriter{
    uml_program: string[][] = []
    indent = 0
    ip = 0
    terminate = false
    file_path = ""

    public run(uml_program, file_name){
        this.uml_program = uml_program
        this.file_path = file_name.replace("examples", "scripts\\diagrams").replace(".oml", ".plantuml")
        if (existsSync(this.file_path)){
            truncateSync(this.file_path)
        }
        while (!this.terminate){
            this.write_line()
        }
    }

    public write_line(){
        for (var i = 0; i < this.indent; i++){
            appendFileSync(this.file_path, "   ")
        }
        this.uml_program[this.ip].forEach(entry => {
            if (entry.indexOf("{")){
                this.indent -= 1
            }
            if (entry.indexOf("}")){
                this.indent += 1
            }
            appendFileSync(this.file_path, entry + " ")
        })
        appendFileSync(this.file_path, "\n")
        this.ip += 1
        if (this.ip >= this.uml_program.length){
            this.terminate = true
        }
    }
}