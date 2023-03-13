# This class takes in a tokenized OML program and writes
# it into a new file with the same name but with .plantuml type
class OMLWriter:
    def run(self, oml_program, file_name):
        self.oml_program = oml_program
        self.indent = 0
        self.ip = 0
        self.terminate = False
        try:
            self.java_file = open("diagrams\\" + file_name + ".plantuml", "x")
        except:
            self.java_file = open("diagrams\\" + file_name + ".plantuml", "w")
        while not self.terminate:
            self.write_line()
        self.java_file.close()
    
    def write_line(self):
        for i in range(0, self.indent):
                self.java_file.write("   ")
        for entry in self.oml_program[self.ip]:
            if "}" in entry:
                self.indent -= 1
            if "{" in entry:
                self.indent += 1
            self.java_file.write(entry + " ")
        self.java_file.write("\n")
        self.ip += 1
        if self.ip >= len(self.oml_program):
            self.terminate = True
