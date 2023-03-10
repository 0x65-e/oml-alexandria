import os.path
from OMLInterpreter import Interpreter
from OMLWriter import OMLWriter

def tokenize_program():
    tokenized_program = []
    line_list = []
    for line in oml_file:
        line = remove_comment(line)
        line_list = line.split()
        if line_list: tokenized_program.append(line_list)
    return tokenized_program

def remove_comment(line):
    if "//"  in line:
        return line[0:line.index("//")]
    return line

def remove_multiline_comment(tokenized_program):
    startComment = False
    stripped_program = tokenized_program
    for line in tokenized_program:
        stripped_line = []
        for token in line:
            if token == "/*":
                startComment = True
            if not startComment:
                stripped_line.append(token)
            if token == "*/":
                startComment = False
        stripped_program.append(stripped_line)
    return stripped_program

file_path = str(input())
file_name = file_path.split("\\")[-1]
oml_file = open(file_path)

tokenized_program = tokenize_program()

oml_interpreter = Interpreter()
uml_program = oml_interpreter.run(tokenized_program)

uml_writer = OMLWriter()
uml_writer.run(uml_program, file_name[0:file_name.index(".")])
