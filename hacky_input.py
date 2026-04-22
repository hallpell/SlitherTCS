import asyncio
import js

_pending_inputs = []

def input(prompt=""):
    loop = asyncio.get_event_loop()
    fut = loop.create_future()

    _pending_inputs.append(fut)
    js._pending_inputs = _pending_inputs
    js.requestInput(prompt)

    return loop.run_until_complete(fut)
  
x = input("Hello")

print(x)

# this is code that overwrites input to behave approximately as I'd like
# this currently is required to be in the user's code, but will soon be injected
# so that the user's code works properly
