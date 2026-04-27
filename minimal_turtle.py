import turtle
import turtleSender

t = turtle.Turtle()
t.forward(100)
turtle.Screen().bgcolor("blue")

svg = turtle.Screen().show_scene()
turtleSender.send(svg)

# this is to document what needs to happen to get turtles to behave.
# The final 2 lines want to get folded into screen.mainloop()
#  (as well as not forcing the user to import turtleSender)
# The UI thread should also resize the graphics to fit in the space allotted
