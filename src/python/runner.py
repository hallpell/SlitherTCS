from code import InteractiveConsole
import sys

class myConsole(InteractiveConsole):
    def showtraceback(self):
        typ, value, tb = sys.exc_info()

        if typ is KeyboardInterrupt:
            print("KeyboardInterrupt", file=sys.stderr)
            return

        super().showtraceback()

env = {}
console = myConsole(locals = env)

# this returns True if the code ran (including if it threw an error)
#   and returns False if it requires more input to be valid Python code
def feed_code(inputCode):
    global console
    try:
        more = console.push(inputCode)
        return not more
    except:
        return True
    return True

def exec_file(inputCode):
    global env
    exec(inputCode, env)
    return True

def refresh():
    global console, env
    env = {}
    console = myConsole(locals=env)

def abandon():
    global console
    console.resetbuffer()
