import codeop

def is_complete(code):
    try:
        if codeop.compile_command(code) is None: # fails to compile
            return False
    except:
        return True
    return True
