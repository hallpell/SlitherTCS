from code import InteractiveConsole

env = {}
console = InteractiveConsole(locals = env)

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
    console = InteractiveConsole(locals=env)
