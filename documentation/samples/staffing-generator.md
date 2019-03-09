# Staffing Generator Sample

This is an example of a synthetic generator that produces `OutOfService` events
for a hypothetical workforce, consisting of multiple crews, each working a
specific shift.

In this example, there are two shifts - a `day shift` from 8am to 4pm, and a
`swing shift` from 4pm to midnight. Each shift has a 30 minute lunch break
and two other 15 minute breaks. Both shifts start and end at location 0 and
their breaks are to be taken at location 7.

~~~
% node build/samples/staffing-plan-sample.js

Day Shift: 08:00-15:59
  break: 10:00-10:15
  break: 12:00-12:30
  break: 14:00-14:15

Swing Shift: 16:00-23:59
  break: 18:00-18:15
  break: 20:00-20:30
  break: 22:00-22:15

Crews
  Day Shift: 3 employees
  Swing Shift: 2 employees

Carts:
  Cart 0 - home location is 0
  Cart 1 - home location is 0
  Cart 2 - home location is 0

Jobs:

Cart 0
  Job 0: cart 0 suspends at 0 between MIN and 08:00.
  Job 2: cart 0 suspends at 7 between 10:00 and 10:15.
  Job 3: cart 0 suspends at 7 between 12:00 and 12:30.
  Job 4: cart 0 suspends at 7 between 14:00 and 14:15.
  Job 1: cart 0 suspends at 0 between 15:59 and 16:00.
  Job 16: cart 0 suspends at 7 between 18:00 and 18:15.
  Job 17: cart 0 suspends at 7 between 20:00 and 20:30.
  Job 18: cart 0 suspends at 7 between 22:00 and 22:15.
  Job 15: cart 0 suspends at 0 between 23:59 and MAX.

Cart 1
  Job 5: cart 1 suspends at 0 between MIN and 08:00.
  Job 7: cart 1 suspends at 7 between 10:00 and 10:15.
  Job 8: cart 1 suspends at 7 between 12:00 and 12:30.
  Job 9: cart 1 suspends at 7 between 14:00 and 14:15.
  Job 6: cart 1 suspends at 0 between 15:59 and MAX.

Cart 2
  Job 10: cart 2 suspends at 0 between MIN and 08:00.
  Job 12: cart 2 suspends at 7 between 10:00 and 10:15.
  Job 13: cart 2 suspends at 7 between 12:00 and 12:30.
  Job 14: cart 2 suspends at 7 between 14:00 and 14:15.
  Job 11: cart 2 suspends at 0 between 15:59 and 16:00.
  Job 20: cart 2 suspends at 7 between 18:00 and 18:15.
  Job 21: cart 2 suspends at 7 between 20:00 and 20:30.
  Job 22: cart 2 suspends at 7 between 22:00 and 22:15.
  Job 19: cart 2 suspends at 0 between 23:59 and MAX.
  ~~~
