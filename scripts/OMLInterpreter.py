# This class takes in a tokenized OML Classdiagram program and
# converts it into a tokenized plantUML program

class Interpreter:
    def run(self, tokenized_program):
        self.tokenized_program = tokenized_program
        self.uml_program = []
        self.terminate = False
        self.ip = 0
        self.num_indents = 0
        self.class_list = []
        self.dict = {"contains": "o--", "isContainedBy": "--o"}
        while not self.terminate:
            self.process_line()
        return self.uml_program
    
    def process_line(self):
        line = self.tokenized_program[self.ip]
        match (line[0]):
            case "vocabulary":
                self.uml_program.append(["@startuml"])
                self.uml_program.append(["package", line[3], "{"])
            case "concept":
                self.uml_program.append(["class", line[1]])
                if "[" in line:
                    line = line[0:-1]
                if ":>" in line:
                    super_list = line[3:] # Create a list of superclasses to inherit from
                    for super in super_list:
                        self.uml_program.append([line[1], "--|>", super.strip(",")])
            case "aspect":
                self.uml_program.append(["abstract", "class", line[1]])
                if "[" in line:
                    line = line[0:-1]
                if ":>" in line:
                    super_list = line[3:] # Create a list of superclasses to inherit from
                    for super in super_list:
                        self.uml_program.append([line[1], "--|>", super.strip(",")])
            case "relation":
                from_line = self.tokenized_program[self.ip+1]
                to_line = self.tokenized_program[self.ip+2]
                forward_line = self.tokenized_program[self.ip+3] if "forward" in self.tokenized_program[self.ip+3] else []
                if "Contains" in line:
                    self.uml_program.append([from_line[1], self.dict[forward_line[1]], to_line[1]])
                if "Performs" in line:
                    func_name = to_line[1] if "performs" in forward_line else from_line[1]
                    class_name = to_line[1] if "isPerformedBy" in forward_line else from_line[1]
                    self.parse_function(func_name, class_name)
            case "}":
                self.uml_program.append(["}"])
                self.uml_program.append(["@enduml"])
            case default:
                pass
        self.advance_statement()
    
    def advance_statement(self):
        self.ip += 1
        if self.ip >= len(self.tokenized_program):
            self.terminate = True
    
    def parse_function(self, func_name, class_name):
        class_index = -1
        func_index = -1
        for i in range(0, len(self.uml_program)):
            if "class" and func_name in self.uml_program[i]:
                func_index = i
            if "class" and class_name in self.uml_program[i]:
                class_index = i
        self.uml_program.remove(self.uml_program[func_index])
        self.uml_program[class_index-1].append("{")
        self.uml_program.insert(class_index, ["", "", "", func_name])
        self.uml_program.insert(class_index+1, ["}"])