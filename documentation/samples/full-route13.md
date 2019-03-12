# Full Route13

This sample simulates operations during a 24 hour period
using 52 synthetic `TransferJobs`.

The sample currently supports two `Dispatchers`:
* `SimpleDispatcher` - Each `Cart` works on one `Job` at a time.
When a cart finishes a `Job`, the `Dispatcher` gives it
another one, selected from known `Jobs` in FIFO order.
* `PlanningLoopDispatcher` - A `JobAssigner` evaluates all
assignments of triples of `Jobs` to `Carts`.
The planner runs every 15 minutes. `Carts` check between
each `Action` for an updated plan.

The `--simple` command-line argument will select the `SimpleDispatcher`. Otherwise the simulation will default to the `PlanningLoopDispatcher`.

The program first generates and prints out a set of synthetic
`TransferJobs`. Then it runs the simulator from `00:00` to `23:59`.

~~~
% node build/samples/full-route13.js --simple

Berth 0
  Inbound #15 at 08:10 => Outbound #35 at 09:10
    Job 39: move 2 items from 0 to 1 between 08:10 and 09:43 (01:32)
    Job 40: move 5 items from 0 to 2 between 08:10 and 10:13 (02:03)
    Job 41: move 1 items from 0 to 2 between 08:10 and 11:17 (03:07)
    Job 42: move 5 items from 0 to 1 between 08:10 and 14:40 (06:30)
  Inbound #14 at 09:13 => Outbound #34 at 10:13
    Job 37: move 4 items from 0 to 2 between 09:13 and 10:13 (01:00)
    Job 38: move 5 items from 0 to 2 between 09:13 and 11:17 (02:04)
  Inbound #2 at 12:49 => Outbound #22 at 13:49
    Job 6: move 5 items from 0 to 1 between 12:49 and 14:40 (01:51)
    Job 7: move 2 items from 0 to 1 between 12:49 and 16:29 (03:40)
    Job 8: move 1 items from 0 to 1 between 12:49 and 17:43 (04:53)
    Job 9: move 1 items from 0 to 2 between 12:49 and 17:55 (05:06)
    Job 10: move 1 items from 0 to 2 between 12:49 and 19:55 (07:06)
  Inbound #4 at 16:11 => Outbound #24 at 17:11
    Job 15: move 1 items from 0 to 1 between 16:11 and 17:43 (01:31)
    Job 16: move 1 items from 0 to 2 between 16:11 and 17:55 (01:43)
    Job 17: move 5 items from 0 to 3 between 16:11 and 17:56 (01:45)
    Job 18: move 4 items from 0 to 1 between 16:11 and 21:56 (05:44)
  Inbound #13 at 18:59 => Outbound #33 at 19:59
    Job 33: move 3 items from 0 to 2 between 18:59 and 19:55 (00:56)
    Job 34: move 1 items from 0 to 1 between 18:59 and 21:56 (02:57)
    Job 35: move 4 items from 0 to 2 between 18:59 and 23:07 (04:08)
    Job 36: move 2 items from 0 to 1 between 18:59 and 23:47 (04:47)

Berth 1
  Inbound #1 at 08:43 => Outbound #21 at 09:43
    Job 3: move 2 items from 1 to 0 between 08:43 and 10:13 (01:30)
    Job 4: move 3 items from 1 to 2 between 08:43 and 10:13 (01:30)
    Job 5: move 2 items from 1 to 2 between 08:43 and 11:17 (02:34)
  Inbound #7 at 11:14 => Outbound #27 at 12:14
    Job 22: move 1 items from 1 to 2 between 11:14 and 13:09 (01:54)
    Job 23: move 5 items from 1 to 0 between 11:14 and 13:49 (02:34)
  Inbound #10 at 13:40 => Outbound #30 at 14:40
    Job 28: move 3 items from 1 to 0 between 13:40 and 17:11 (03:31)
    Job 29: move 3 items from 1 to 3 between 13:40 and 17:56 (04:16)
    Job 30: move 3 items from 1 to 2 between 13:40 and 19:55 (06:15)
  Inbound #0 at 15:29 => Outbound #20 at 16:29
    Job 0: move 4 items from 1 to 0 between 15:29 and 17:11 (01:41)
    Job 1: move 4 items from 1 to 2 between 15:29 and 17:55 (02:25)
    Job 2: move 4 items from 1 to 3 between 15:29 and 17:56 (02:27)
  Inbound #17 at 16:43 => Outbound #37 at 17:43
    Job 46: move 2 items from 1 to 2 between 16:43 and 17:55 (01:12)
    Job 47: move 1 items from 1 to 3 between 16:43 and 17:56 (01:13)
  Inbound #5 at 20:56 => Outbound #25 at 21:56
    Job 19: move 3 items from 1 to 3 between 20:56 and 22:21 (01:25)
    Job 20: move 2 items from 1 to 2 between 20:56 and 23:07 (02:11)
  Inbound #12 at 22:47 => Outbound #32 at 23:47

Berth 2
  Inbound #9 at 09:13 => Outbound #29 at 10:13
    Job 27: move 5 items from 2 to 0 between 09:13 and 10:13 (00:59)
  Inbound #11 at 10:17 => Outbound #31 at 11:17
    Job 31: move 2 items from 2 to 1 between 10:17 and 12:14 (01:57)
    Job 32: move 1 items from 2 to 0 between 10:17 and 13:49 (03:31)
  Inbound #18 at 12:09 => Outbound #38 at 13:09
    Job 48: move 2 items from 2 to 0 between 12:09 and 13:49 (01:39)
    Job 49: move 5 items from 2 to 3 between 12:09 and 17:56 (05:47)
  Inbound #16 at 16:55 => Outbound #36 at 17:55
    Job 43: move 1 items from 2 to 1 between 16:55 and 17:43 (00:47)
    Job 44: move 3 items from 2 to 3 between 16:55 and 17:56 (01:01)
    Job 45: move 3 items from 2 to 0 between 16:55 and 19:59 (03:04)
  Inbound #19 at 18:55 => Outbound #39 at 19:55
    Job 50: move 4 items from 2 to 0 between 18:55 and 19:59 (01:03)
    Job 51: move 2 items from 2 to 1 between 18:55 and 21:56 (03:00)
  Inbound #6 at 22:07 => Outbound #26 at 23:07
    Job 21: move 4 items from 2 to 1 between 22:07 and 23:47 (01:39)

Berth 3
  Inbound #3 at 16:56 => Outbound #23 at 17:56
    Job 11: move 5 items from 3 to 1 between 16:56 and 17:43 (00:46)
    Job 12: move 3 items from 3 to 2 between 16:56 and 17:55 (00:58)
    Job 13: move 1 items from 3 to 2 between 16:56 and 19:55 (02:59)
    Job 14: move 4 items from 3 to 1 between 16:56 and 21:56 (04:59)
  Inbound #8 at 21:21 => Outbound #28 at 22:21
    Job 24: move 4 items from 3 to 1 between 21:21 and 21:56 (00:34)
    Job 25: move 1 items from 3 to 2 between 21:21 and 23:07 (01:46)
    Job 26: move 5 items from 3 to 1 between 21:21 and 23:47 (02:25)

07:55:12 Job 39 introduced.
07:55:12 Cart 0 plan [39] merges to [39].
07:55:12 Cart 0 waits until 08:10:12.
07:55:12 Job 40 introduced.
07:55:12 Cart 1 plan [40] merges to [40].
07:55:12 Cart 1 waits until 08:10:12.
07:55:12 Job 41 introduced.
07:55:12 Cart 2 plan [41] merges to [41].
07:55:12 Cart 2 waits until 08:10:12.
07:55:12 Job 42 introduced.
08:10:12 Cart 0 commits to Job 39.
08:10:12 Cart 0 begins loading 2 items (payload=0).
08:10:12 Cart 1 commits to Job 40.
08:10:12 Cart 1 begins loading 5 items (payload=0).
08:10:12 Cart 2 commits to Job 41.
08:10:12 Cart 2 begins loading 1 items (payload=0).
08:10:42 Cart 2 finishes loading (payload=1).
08:10:42 Cart 2 departs location 0 for location 2.
08:11:12 Cart 0 finishes loading (payload=2).
08:11:12 Cart 0 departs location 0 for location 1.
08:12:42 Cart 1 finishes loading (payload=5).
08:12:42 Cart 1 departs location 0 for location 2.
08:20:42 Cart 2 passes location 1.
08:21:12 Cart 0 arrives at location 1.
08:21:12 Cart 0 begins unloading 2 items (payload=2)
08:21:32 Cart 0 finishes unloading (payload=0).
08:21:32 Job 39 succeeded.
08:21:32 Cart 0 plan [42] merges to [42].
08:21:32 Cart 0 departs location 1 for location 0.
08:22:42 Cart 1 passes location 1.
08:28:00 Job 3 introduced.
08:28:00 Job 4 introduced.
08:28:00 Job 5 introduced.
08:30:42 Cart 2 arrives at location 2.
08:30:42 Cart 2 begins unloading 1 items (payload=1)
08:30:52 Cart 2 finishes unloading (payload=0).
08:30:52 Job 41 succeeded.
08:30:52 Cart 2 plan [3] merges to [3].
08:30:52 Cart 2 departs location 2 for location 1.
08:31:32 Cart 0 arrives at location 0.
08:31:32 Cart 0 commits to Job 42.
08:31:32 Cart 0 begins loading 5 items (payload=0).
08:32:42 Cart 1 arrives at location 2.
08:32:42 Cart 1 begins unloading 5 items (payload=5)
08:33:32 Cart 1 finishes unloading (payload=0).
08:33:32 Job 40 succeeded.
08:33:32 Cart 1 plan [4] merges to [4].
08:33:32 Cart 1 departs location 2 for location 1.
08:34:02 Cart 0 finishes loading (payload=5).
08:34:02 Cart 0 departs location 0 for location 1.
08:40:52 Cart 2 arrives at location 1.
08:40:52 Cart 2 waits until 08:43:00.
08:43:00 Cart 2 commits to Job 3.
08:43:00 Cart 2 begins loading 2 items (payload=0).
08:43:32 Cart 1 arrives at location 1.
08:43:32 Cart 1 commits to Job 4.
08:43:32 Cart 1 begins loading 3 items (payload=0).
08:44:00 Cart 2 finishes loading (payload=2).
08:44:00 Cart 2 departs location 1 for location 0.
08:44:02 Cart 0 arrives at location 1.
08:44:02 Cart 0 begins unloading 5 items (payload=5)
08:44:52 Cart 0 finishes unloading (payload=0).
08:44:52 Job 42 succeeded.
08:44:52 Cart 0 plan [5] merges to [5].
08:44:52 Cart 0 commits to Job 5.
08:44:52 Cart 0 begins loading 2 items (payload=0).
08:45:02 Cart 1 finishes loading (payload=3).
08:45:02 Cart 1 departs location 1 for location 2.
08:45:52 Cart 0 finishes loading (payload=2).
08:45:52 Cart 0 departs location 1 for location 2.
08:54:00 Cart 2 arrives at location 0.
08:54:00 Cart 2 begins unloading 2 items (payload=2)
08:54:20 Cart 2 finishes unloading (payload=0).
08:54:20 Job 3 succeeded.
08:55:02 Cart 1 arrives at location 2.
08:55:02 Cart 1 begins unloading 3 items (payload=3)
08:55:32 Cart 1 finishes unloading (payload=0).
08:55:32 Job 4 succeeded.
08:55:52 Cart 0 arrives at location 2.
08:55:52 Cart 0 begins unloading 2 items (payload=2)
08:56:12 Cart 0 finishes unloading (payload=0).
08:56:12 Job 5 succeeded.
08:58:09 Job 37 introduced.
08:58:09 Cart 2 plan [37] merges to [37].
08:58:09 Cart 2 waits until 09:13:09.
08:58:09 Job 38 introduced.
08:58:09 Cart 1 plan [38] merges to [38].
08:58:09 Cart 1 departs location 2 for location 0.
08:58:47 Job 27 introduced.
08:58:47 Cart 0 plan [27] merges to [27].
08:58:47 Cart 0 waits until 09:13:47.
09:08:09 Cart 1 passes location 1.
09:13:09 Cart 2 commits to Job 37.
09:13:09 Cart 2 begins loading 4 items (payload=0).
09:13:47 Cart 0 commits to Job 27.
09:13:47 Cart 0 begins loading 5 items (payload=0).
09:15:09 Cart 2 finishes loading (payload=4).
09:15:09 Cart 2 departs location 0 for location 2.
09:16:17 Cart 0 finishes loading (payload=5).
09:16:17 Cart 0 departs location 2 for location 0.
09:18:09 Cart 1 arrives at location 0.
09:18:09 Cart 1 commits to Job 38.
09:18:09 Cart 1 begins loading 5 items (payload=0).
09:20:39 Cart 1 finishes loading (payload=5).
09:20:39 Cart 1 departs location 0 for location 2.
09:25:09 Cart 2 passes location 1.
09:26:17 Cart 0 passes location 1.
09:30:39 Cart 1 passes location 1.
09:35:09 Cart 2 arrives at location 2.
09:35:09 Cart 2 begins unloading 4 items (payload=4)
09:35:49 Cart 2 finishes unloading (payload=0).
09:35:49 Job 37 succeeded.
09:36:17 Cart 0 arrives at location 0.
09:36:17 Cart 0 begins unloading 5 items (payload=5)
09:37:07 Cart 0 finishes unloading (payload=0).
09:37:07 Job 27 succeeded.
09:40:39 Cart 1 arrives at location 2.
09:40:39 Cart 1 begins unloading 5 items (payload=5)
09:41:29 Cart 1 finishes unloading (payload=0).
09:41:29 Job 38 succeeded.
10:02:25 Job 31 introduced.
10:02:25 Cart 2 plan [31] merges to [31].
10:02:25 Cart 2 waits until 10:17:25.
10:02:25 Job 32 introduced.
10:02:25 Cart 0 plan [32] merges to [32].
10:02:25 Cart 0 departs location 0 for location 2.
10:12:25 Cart 0 passes location 1.
10:17:25 Cart 2 commits to Job 31.
10:17:25 Cart 2 begins loading 2 items (payload=0).
10:18:25 Cart 2 finishes loading (payload=2).
10:18:25 Cart 2 departs location 2 for location 1.
10:22:25 Cart 0 arrives at location 2.
10:22:25 Cart 0 commits to Job 32.
10:22:25 Cart 0 begins loading 1 items (payload=0).
10:22:55 Cart 0 finishes loading (payload=1).
10:22:55 Cart 0 departs location 2 for location 0.
10:28:25 Cart 2 arrives at location 1.
10:28:25 Cart 2 begins unloading 2 items (payload=2)
10:28:45 Cart 2 finishes unloading (payload=0).
10:28:45 Job 31 succeeded.
10:32:55 Cart 0 passes location 1.
10:42:55 Cart 0 arrives at location 0.
10:42:55 Cart 0 begins unloading 1 items (payload=1)
10:43:05 Cart 0 finishes unloading (payload=0).
10:43:05 Job 32 succeeded.
10:59:45 Job 23 introduced.
10:59:45 Cart 1 plan [23] merges to [23].
10:59:45 Cart 1 departs location 2 for location 1.
10:59:45 Job 22 introduced.
10:59:45 Cart 2 plan [22] merges to [22].
10:59:45 Cart 2 waits until 11:14:45.
11:09:45 Cart 1 arrives at location 1.
11:09:45 Cart 1 waits until 11:14:45.
11:14:45 Cart 2 commits to Job 22.
11:14:45 Cart 2 begins loading 1 items (payload=0).
11:14:45 Cart 1 commits to Job 23.
11:14:45 Cart 1 begins loading 5 items (payload=0).
11:15:15 Cart 2 finishes loading (payload=1).
11:15:15 Cart 2 departs location 1 for location 2.
11:17:15 Cart 1 finishes loading (payload=5).
11:17:15 Cart 1 departs location 1 for location 0.
11:25:15 Cart 2 arrives at location 2.
11:25:15 Cart 2 begins unloading 1 items (payload=1)
11:25:25 Cart 2 finishes unloading (payload=0).
11:25:25 Job 22 succeeded.
11:27:15 Cart 1 arrives at location 0.
11:27:15 Cart 1 begins unloading 5 items (payload=5)
11:28:05 Cart 1 finishes unloading (payload=0).
11:28:05 Job 23 succeeded.
11:54:22 Job 48 introduced.
11:54:22 Cart 0 plan [48] merges to [48].
11:54:22 Cart 0 departs location 0 for location 2.
11:54:22 Job 49 introduced.
11:54:22 Cart 2 plan [49] merges to [49].
11:54:22 Cart 2 waits until 12:09:22.
12:04:22 Cart 0 passes location 1.
12:09:22 Cart 2 commits to Job 49.
12:09:22 Cart 2 begins loading 5 items (payload=0).
12:11:52 Cart 2 finishes loading (payload=5).
12:11:52 Cart 2 departs location 2 for location 3.
12:14:22 Cart 0 arrives at location 2.
12:14:22 Cart 0 commits to Job 48.
12:14:22 Cart 0 begins loading 2 items (payload=0).
12:15:22 Cart 0 finishes loading (payload=2).
12:15:22 Cart 0 departs location 2 for location 0.
12:21:52 Cart 2 arrives at location 3.
12:21:52 Cart 2 begins unloading 5 items (payload=5)
12:22:42 Cart 2 finishes unloading (payload=0).
12:22:42 Job 49 succeeded.
12:25:22 Cart 0 passes location 1.
12:34:06 Job 8 introduced.
12:34:06 Cart 1 plan [8] merges to [8].
12:34:06 Cart 1 waits until 12:49:06.
12:34:06 Job 7 introduced.
12:34:06 Cart 2 plan [7] merges to [7].
12:34:06 Cart 2 departs location 3 for location 0.
12:34:06 Job 10 introduced.
12:34:06 Job 9 introduced.
12:34:06 Job 6 introduced.
12:35:22 Cart 0 arrives at location 0.
12:35:22 Cart 0 begins unloading 2 items (payload=2)
12:35:42 Cart 0 finishes unloading (payload=0).
12:35:42 Job 48 succeeded.
12:35:42 Cart 0 plan [10] merges to [10].
12:35:42 Cart 0 waits until 12:49:06.
12:44:06 Cart 2 passes location 2.
12:49:06 Cart 1 commits to Job 8.
12:49:06 Cart 1 begins loading 1 items (payload=0).
12:49:06 Cart 0 commits to Job 10.
12:49:06 Cart 0 begins loading 1 items (payload=0).
12:49:36 Cart 1 finishes loading (payload=1).
12:49:36 Cart 1 departs location 0 for location 1.
12:49:36 Cart 0 finishes loading (payload=1).
12:49:36 Cart 0 departs location 0 for location 2.
12:54:06 Cart 2 passes location 1.
12:59:36 Cart 1 arrives at location 1.
12:59:36 Cart 1 begins unloading 1 items (payload=1)
12:59:36 Cart 0 passes location 1.
12:59:46 Cart 1 finishes unloading (payload=0).
12:59:46 Job 8 succeeded.
12:59:46 Cart 1 plan [9] merges to [9].
12:59:46 Cart 1 departs location 1 for location 0.
13:04:06 Cart 2 arrives at location 0.
13:04:06 Cart 2 commits to Job 7.
13:04:06 Cart 2 begins loading 2 items (payload=0).
13:05:06 Cart 2 finishes loading (payload=2).
13:05:06 Cart 2 departs location 0 for location 1.
13:09:36 Cart 0 arrives at location 2.
13:09:36 Cart 0 begins unloading 1 items (payload=1)
13:09:46 Cart 1 arrives at location 0.
13:09:46 Cart 1 commits to Job 9.
13:09:46 Cart 1 begins loading 1 items (payload=0).
13:09:46 Cart 0 finishes unloading (payload=0).
13:09:46 Job 10 succeeded.
13:09:46 Cart 0 plan [6] merges to [6].
13:09:46 Cart 0 departs location 2 for location 0.
13:10:16 Cart 1 finishes loading (payload=1).
13:10:16 Cart 1 departs location 0 for location 2.
13:15:06 Cart 2 arrives at location 1.
13:15:06 Cart 2 begins unloading 2 items (payload=2)
13:15:26 Cart 2 finishes unloading (payload=0).
13:15:26 Job 7 succeeded.
13:19:46 Cart 0 passes location 1.
13:20:16 Cart 1 passes location 1.
13:25:13 Job 28 introduced.
13:25:13 Cart 2 plan [28] merges to [28].
13:25:13 Cart 2 waits until 13:40:13.
13:25:13 Job 29 introduced.
13:25:13 Job 30 introduced.
13:29:46 Cart 0 arrives at location 0.
13:29:46 Cart 0 commits to Job 6.
13:29:46 Cart 0 begins loading 5 items (payload=0).
13:30:16 Cart 1 arrives at location 2.
13:30:16 Cart 1 begins unloading 1 items (payload=1)
13:30:26 Cart 1 finishes unloading (payload=0).
13:30:26 Job 9 succeeded.
13:30:26 Cart 1 plan [29] merges to [29].
13:30:26 Cart 1 departs location 2 for location 1.
13:32:16 Cart 0 finishes loading (payload=5).
13:32:16 Cart 0 departs location 0 for location 1.
13:40:13 Cart 2 commits to Job 28.
13:40:13 Cart 2 begins loading 3 items (payload=0).
13:40:26 Cart 1 arrives at location 1.
13:40:26 Cart 1 commits to Job 29.
13:40:26 Cart 1 begins loading 3 items (payload=0).
13:41:43 Cart 2 finishes loading (payload=3).
13:41:43 Cart 2 departs location 1 for location 0.
13:41:56 Cart 1 finishes loading (payload=3).
13:41:56 Cart 1 departs location 1 for location 3.
13:42:16 Cart 0 arrives at location 1.
13:42:16 Cart 0 begins unloading 5 items (payload=5)
13:43:06 Cart 0 finishes unloading (payload=0).
13:43:06 Job 6 succeeded.
13:43:06 Cart 0 plan [30] merges to [30].
13:43:06 Cart 0 commits to Job 30.
13:43:06 Cart 0 begins loading 3 items (payload=0).
13:44:36 Cart 0 finishes loading (payload=3).
13:44:36 Cart 0 departs location 1 for location 2.
13:51:43 Cart 2 arrives at location 0.
13:51:43 Cart 2 begins unloading 3 items (payload=3)
13:51:56 Cart 1 passes location 2.
13:52:13 Cart 2 finishes unloading (payload=0).
13:52:13 Job 28 succeeded.
13:54:36 Cart 0 arrives at location 2.
13:54:36 Cart 0 begins unloading 3 items (payload=3)
13:55:06 Cart 0 finishes unloading (payload=0).
13:55:06 Job 30 succeeded.
14:01:56 Cart 1 arrives at location 3.
14:01:56 Cart 1 begins unloading 3 items (payload=3)
14:02:26 Cart 1 finishes unloading (payload=0).
14:02:26 Job 29 succeeded.
15:14:20 Job 0 introduced.
15:14:20 Cart 2 plan [0] merges to [0].
15:14:20 Cart 2 departs location 0 for location 1.
15:14:20 Job 1 introduced.
15:14:20 Cart 0 plan [1] merges to [1].
15:14:20 Cart 0 departs location 2 for location 1.
15:14:20 Job 2 introduced.
15:14:20 Cart 1 plan [2] merges to [2].
15:14:20 Cart 1 departs location 3 for location 1.
15:24:20 Cart 2 arrives at location 1.
15:24:20 Cart 2 waits until 15:29:20.
15:24:20 Cart 0 arrives at location 1.
15:24:20 Cart 0 waits until 15:29:20.
15:24:20 Cart 1 passes location 2.
15:29:20 Cart 2 commits to Job 0.
15:29:20 Cart 2 begins loading 4 items (payload=0).
15:29:20 Cart 0 commits to Job 1.
15:29:20 Cart 0 begins loading 4 items (payload=0).
15:31:20 Cart 2 finishes loading (payload=4).
15:31:20 Cart 2 departs location 1 for location 0.
15:31:20 Cart 0 finishes loading (payload=4).
15:31:20 Cart 0 departs location 1 for location 2.
15:34:20 Cart 1 arrives at location 1.
15:34:20 Cart 1 commits to Job 2.
15:34:20 Cart 1 begins loading 4 items (payload=0).
15:36:20 Cart 1 finishes loading (payload=4).
15:36:20 Cart 1 departs location 1 for location 3.
15:41:20 Cart 2 arrives at location 0.
15:41:20 Cart 2 begins unloading 4 items (payload=4)
15:41:20 Cart 0 arrives at location 2.
15:41:20 Cart 0 begins unloading 4 items (payload=4)
15:42:00 Cart 2 finishes unloading (payload=0).
15:42:00 Job 0 succeeded.
15:42:00 Cart 0 finishes unloading (payload=0).
15:42:00 Job 1 succeeded.
15:46:20 Cart 1 passes location 2.
15:56:18 Job 16 introduced.
15:56:18 Cart 2 plan [16] merges to [16].
15:56:18 Cart 2 waits until 16:11:18.
15:56:18 Job 18 introduced.
15:56:18 Cart 0 plan [18] merges to [18].
15:56:18 Cart 0 departs location 2 for location 0.
15:56:18 Job 15 introduced.
15:56:18 Job 17 introduced.
15:56:20 Cart 1 arrives at location 3.
15:56:20 Cart 1 begins unloading 4 items (payload=4)
15:57:00 Cart 1 finishes unloading (payload=0).
15:57:00 Job 2 succeeded.
15:57:00 Cart 1 plan [15] merges to [15].
15:57:00 Cart 1 departs location 3 for location 0.
16:06:18 Cart 0 passes location 1.
16:07:00 Cart 1 passes location 2.
16:11:18 Cart 2 commits to Job 16.
16:11:18 Cart 2 begins loading 1 items (payload=0).
16:11:48 Cart 2 finishes loading (payload=1).
16:11:48 Cart 2 departs location 0 for location 2.
16:16:18 Cart 0 arrives at location 0.
16:16:18 Cart 0 commits to Job 18.
16:16:18 Cart 0 begins loading 4 items (payload=0).
16:17:00 Cart 1 passes location 1.
16:18:18 Cart 0 finishes loading (payload=4).
16:18:18 Cart 0 departs location 0 for location 1.
16:21:48 Cart 2 passes location 1.
16:27:00 Cart 1 arrives at location 0.
16:27:00 Cart 1 commits to Job 15.
16:27:00 Cart 1 begins loading 1 items (payload=0).
16:27:30 Cart 1 finishes loading (payload=1).
16:27:30 Cart 1 departs location 0 for location 1.
16:28:04 Job 46 introduced.
16:28:04 Job 47 introduced.
16:28:18 Cart 0 arrives at location 1.
16:28:18 Cart 0 begins unloading 4 items (payload=4)
16:28:58 Cart 0 finishes unloading (payload=0).
16:28:58 Job 18 succeeded.
16:28:58 Cart 0 plan [17] merges to [17].
16:28:58 Cart 0 departs location 1 for location 0.
16:31:48 Cart 2 arrives at location 2.
16:31:48 Cart 2 begins unloading 1 items (payload=1)
16:31:58 Cart 2 finishes unloading (payload=0).
16:31:58 Job 16 succeeded.
16:31:58 Cart 2 plan [46] merges to [46].
16:31:58 Cart 2 departs location 2 for location 1.
16:37:30 Cart 1 arrives at location 1.
16:37:30 Cart 1 begins unloading 1 items (payload=1)
16:37:40 Cart 1 finishes unloading (payload=0).
16:37:40 Job 15 succeeded.
16:37:40 Cart 1 plan [47] merges to [47].
16:37:40 Cart 1 waits until 16:43:04.
16:38:58 Cart 0 arrives at location 0.
16:38:58 Cart 0 commits to Job 17.
16:38:58 Cart 0 begins loading 5 items (payload=0).
16:40:13 Job 45 introduced.
16:40:13 Job 43 introduced.
16:40:13 Job 44 introduced.
16:41:28 Cart 0 finishes loading (payload=5).
16:41:28 Cart 0 departs location 0 for location 3.
16:41:29 Job 12 introduced.
16:41:29 Job 13 introduced.
16:41:29 Job 14 introduced.
16:41:29 Job 11 introduced.
16:41:58 Cart 2 arrives at location 1.
16:41:58 Cart 2 waits until 16:43:04.
16:43:04 Cart 1 commits to Job 47.
16:43:04 Cart 1 begins loading 1 items (payload=0).
16:43:04 Cart 2 commits to Job 46.
16:43:04 Cart 2 begins loading 2 items (payload=0).
16:43:34 Cart 1 finishes loading (payload=1).
16:43:34 Cart 1 departs location 1 for location 3.
16:44:04 Cart 2 finishes loading (payload=2).
16:44:04 Cart 2 departs location 1 for location 2.
16:51:28 Cart 0 passes location 1.
16:53:34 Cart 1 passes location 2.
16:54:04 Cart 2 arrives at location 2.
16:54:04 Cart 2 begins unloading 2 items (payload=2)
16:54:24 Cart 2 finishes unloading (payload=0).
16:54:24 Job 46 succeeded.
16:54:24 Cart 2 plan [45] merges to [45].
16:54:24 Cart 2 waits until 16:55:13.
16:55:13 Cart 2 commits to Job 45.
16:55:13 Cart 2 begins loading 3 items (payload=0).
16:56:43 Cart 2 finishes loading (payload=3).
16:56:43 Cart 2 departs location 2 for location 0.
17:01:28 Cart 0 passes location 2.
17:03:34 Cart 1 arrives at location 3.
17:03:34 Cart 1 begins unloading 1 items (payload=1)
17:03:44 Cart 1 finishes unloading (payload=0).
17:03:44 Job 47 succeeded.
17:03:44 Cart 1 plan [43] merges to [43].
17:03:44 Cart 1 departs location 3 for location 2.
17:06:43 Cart 2 passes location 1.
17:11:28 Cart 0 arrives at location 3.
17:11:28 Cart 0 begins unloading 5 items (payload=5)
17:12:18 Cart 0 finishes unloading (payload=0).
17:12:18 Job 17 succeeded.
17:12:18 Cart 0 plan [44] merges to [44].
17:12:18 Cart 0 departs location 3 for location 2.
17:13:44 Cart 1 arrives at location 2.
17:13:44 Cart 1 commits to Job 43.
17:13:44 Cart 1 begins loading 1 items (payload=0).
17:14:14 Cart 1 finishes loading (payload=1).
17:14:14 Cart 1 departs location 2 for location 1.
17:16:43 Cart 2 arrives at location 0.
17:16:43 Cart 2 begins unloading 3 items (payload=3)
17:17:13 Cart 2 finishes unloading (payload=0).
17:17:13 Job 45 succeeded.
17:17:13 Cart 2 plan [12] merges to [12].
17:17:13 Job 12 failed.
17:17:13 Cart 2 plan [13] merges to [13].
17:17:13 Cart 2 departs location 0 for location 3.
17:22:18 Cart 0 arrives at location 2.
17:22:18 Cart 0 commits to Job 44.
17:22:18 Cart 0 begins loading 3 items (payload=0).
17:23:48 Cart 0 finishes loading (payload=3).
17:23:48 Cart 0 departs location 2 for location 3.
17:24:14 Cart 1 arrives at location 1.
17:24:14 Cart 1 begins unloading 1 items (payload=1)
17:24:24 Cart 1 finishes unloading (payload=0).
17:24:24 Job 43 succeeded.
17:24:24 Cart 1 plan [14] merges to [14].
17:24:24 Cart 1 departs location 1 for location 3.
17:27:13 Cart 2 passes location 1.
17:33:48 Cart 0 arrives at location 3.
17:33:48 Cart 0 begins unloading 3 items (payload=3)
17:34:18 Cart 0 finishes unloading (payload=0).
17:34:18 Job 44 succeeded.
17:34:18 Cart 0 plan [11] merges to [11].
17:34:18 Job 11 failed.
17:34:24 Cart 1 passes location 2.
17:37:13 Cart 2 passes location 2.
17:44:24 Cart 1 arrives at location 3.
17:44:24 Cart 1 commits to Job 14.
17:44:24 Cart 1 begins loading 4 items (payload=0).
17:46:24 Cart 1 finishes loading (payload=4).
17:46:24 Cart 1 departs location 3 for location 1.
17:47:13 Cart 2 arrives at location 3.
17:47:13 Cart 2 commits to Job 13.
17:47:13 Cart 2 begins loading 1 items (payload=0).
17:47:43 Cart 2 finishes loading (payload=1).
17:47:43 Cart 2 departs location 3 for location 2.
17:56:24 Cart 1 passes location 2.
17:57:43 Cart 2 arrives at location 2.
17:57:43 Cart 2 begins unloading 1 items (payload=1)
17:57:53 Cart 2 finishes unloading (payload=0).
17:57:53 Job 13 succeeded.
18:06:24 Cart 1 arrives at location 1.
18:06:24 Cart 1 begins unloading 4 items (payload=4)
18:07:04 Cart 1 finishes unloading (payload=0).
18:07:04 Job 14 succeeded.
18:40:58 Job 50 introduced.
18:40:58 Cart 0 plan [50] merges to [50].
18:40:58 Cart 0 departs location 3 for location 2.
18:40:58 Job 51 introduced.
18:40:58 Cart 2 plan [51] merges to [51].
18:40:58 Cart 2 waits until 18:55:58.
18:44:13 Job 36 introduced.
18:44:13 Cart 1 plan [36] merges to [36].
18:44:13 Cart 1 departs location 1 for location 0.
18:44:13 Job 34 introduced.
18:44:13 Job 33 introduced.
18:44:13 Job 35 introduced.
18:50:58 Cart 0 arrives at location 2.
18:50:58 Cart 0 waits until 18:55:58.
18:54:13 Cart 1 arrives at location 0.
18:54:13 Cart 1 waits until 18:59:13.
18:55:58 Cart 2 commits to Job 51.
18:55:58 Cart 2 begins loading 2 items (payload=0).
18:55:58 Cart 0 commits to Job 50.
18:55:58 Cart 0 begins loading 4 items (payload=0).
18:56:58 Cart 2 finishes loading (payload=2).
18:56:58 Cart 2 departs location 2 for location 1.
18:57:58 Cart 0 finishes loading (payload=4).
18:57:58 Cart 0 departs location 2 for location 0.
18:59:13 Cart 1 commits to Job 36.
18:59:13 Cart 1 begins loading 2 items (payload=0).
19:00:13 Cart 1 finishes loading (payload=2).
19:00:13 Cart 1 departs location 0 for location 1.
19:06:58 Cart 2 arrives at location 1.
19:06:58 Cart 2 begins unloading 2 items (payload=2)
19:07:18 Cart 2 finishes unloading (payload=0).
19:07:18 Job 51 succeeded.
19:07:18 Cart 2 plan [34] merges to [34].
19:07:18 Cart 2 departs location 1 for location 0.
19:07:58 Cart 0 passes location 1.
19:10:13 Cart 1 arrives at location 1.
19:10:13 Cart 1 begins unloading 2 items (payload=2)
19:10:33 Cart 1 finishes unloading (payload=0).
19:10:33 Job 36 succeeded.
19:10:33 Cart 1 plan [33] merges to [33].
19:10:33 Cart 1 departs location 1 for location 0.
19:17:18 Cart 2 arrives at location 0.
19:17:18 Cart 2 commits to Job 34.
19:17:18 Cart 2 begins loading 1 items (payload=0).
19:17:48 Cart 2 finishes loading (payload=1).
19:17:48 Cart 2 departs location 0 for location 1.
19:17:58 Cart 0 arrives at location 0.
19:17:58 Cart 0 begins unloading 4 items (payload=4)
19:18:38 Cart 0 finishes unloading (payload=0).
19:18:38 Job 50 succeeded.
19:18:38 Cart 0 plan [35] merges to [35].
19:18:38 Cart 0 commits to Job 35.
19:18:38 Cart 0 begins loading 4 items (payload=0).
19:20:33 Cart 1 arrives at location 0.
19:20:33 Cart 1 commits to Job 33.
19:20:33 Cart 1 begins loading 3 items (payload=0).
19:20:38 Cart 0 finishes loading (payload=4).
19:20:38 Cart 0 departs location 0 for location 2.
19:22:03 Cart 1 finishes loading (payload=3).
19:22:03 Cart 1 departs location 0 for location 2.
19:27:48 Cart 2 arrives at location 1.
19:27:48 Cart 2 begins unloading 1 items (payload=1)
19:27:58 Cart 2 finishes unloading (payload=0).
19:27:58 Job 34 succeeded.
19:30:38 Cart 0 passes location 1.
19:32:03 Cart 1 passes location 1.
19:40:38 Cart 0 arrives at location 2.
19:40:38 Cart 0 begins unloading 4 items (payload=4)
19:41:18 Cart 0 finishes unloading (payload=0).
19:41:18 Job 35 succeeded.
19:42:03 Cart 1 arrives at location 2.
19:42:03 Cart 1 begins unloading 3 items (payload=3)
19:42:33 Cart 1 finishes unloading (payload=0).
19:42:33 Job 33 succeeded.
20:41:14 Job 19 introduced.
20:41:14 Cart 2 plan [19] merges to [19].
20:41:14 Cart 2 waits until 20:56:14.
20:41:14 Job 20 introduced.
20:41:14 Cart 0 plan [20] merges to [20].
20:41:14 Cart 0 departs location 2 for location 1.
20:51:14 Cart 0 arrives at location 1.
20:51:14 Cart 0 waits until 20:56:14.
20:56:14 Cart 2 commits to Job 19.
20:56:14 Cart 2 begins loading 3 items (payload=0).
20:56:14 Cart 0 commits to Job 20.
20:56:14 Cart 0 begins loading 2 items (payload=0).
20:57:14 Cart 0 finishes loading (payload=2).
20:57:14 Cart 0 departs location 1 for location 2.
20:57:44 Cart 2 finishes loading (payload=3).
20:57:44 Cart 2 departs location 1 for location 3.
21:06:18 Job 25 introduced.
21:06:18 Cart 1 plan [25] merges to [25].
21:06:18 Cart 1 departs location 2 for location 3.
21:06:18 Job 26 introduced.
21:06:18 Job 24 introduced.
21:07:14 Cart 0 arrives at location 2.
21:07:14 Cart 0 begins unloading 2 items (payload=2)
21:07:34 Cart 0 finishes unloading (payload=0).
21:07:34 Job 20 succeeded.
21:07:34 Cart 0 plan [26] merges to [26].
21:07:34 Cart 0 departs location 2 for location 3.
21:07:44 Cart 2 passes location 2.
21:16:18 Cart 1 arrives at location 3.
21:16:18 Cart 1 waits until 21:21:18.
21:17:34 Cart 0 arrives at location 3.
21:17:34 Cart 0 waits until 21:21:18.
21:17:44 Cart 2 arrives at location 3.
21:17:44 Cart 2 begins unloading 3 items (payload=3)
21:18:14 Cart 2 finishes unloading (payload=0).
21:18:14 Job 19 succeeded.
21:18:14 Cart 2 plan [24] merges to [24].
21:18:14 Cart 2 waits until 21:21:18.
21:21:18 Cart 1 commits to Job 25.
21:21:18 Cart 1 begins loading 1 items (payload=0).
21:21:18 Cart 2 commits to Job 24.
21:21:18 Cart 2 begins loading 4 items (payload=0).
21:21:18 Cart 0 commits to Job 26.
21:21:18 Cart 0 begins loading 5 items (payload=0).
21:21:48 Cart 1 finishes loading (payload=1).
21:21:48 Cart 1 departs location 3 for location 2.
21:23:18 Cart 2 finishes loading (payload=4).
21:23:18 Cart 2 departs location 3 for location 1.
21:23:48 Cart 0 finishes loading (payload=5).
21:23:48 Cart 0 departs location 3 for location 1.
21:31:48 Cart 1 arrives at location 2.
21:31:48 Cart 1 begins unloading 1 items (payload=1)
21:31:58 Cart 1 finishes unloading (payload=0).
21:31:58 Job 25 succeeded.
21:33:18 Cart 2 passes location 2.
21:33:48 Cart 0 passes location 2.
21:43:18 Cart 2 arrives at location 1.
21:43:18 Cart 2 begins unloading 4 items (payload=4)
21:43:48 Cart 0 arrives at location 1.
21:43:48 Cart 0 begins unloading 5 items (payload=5)
21:43:58 Cart 2 finishes unloading (payload=0).
21:43:58 Job 24 succeeded.
21:44:38 Cart 0 finishes unloading (payload=0).
21:44:38 Job 26 succeeded.
21:52:44 Job 21 introduced.
21:52:44 Cart 1 plan [21] merges to [21].
21:52:44 Cart 1 waits until 22:07:44.
22:07:44 Cart 1 commits to Job 21.
22:07:44 Cart 1 begins loading 4 items (payload=0).
22:09:44 Cart 1 finishes loading (payload=4).
22:09:44 Cart 1 departs location 2 for location 1.
22:19:44 Cart 1 arrives at location 1.
22:19:44 Cart 1 begins unloading 4 items (payload=4)
22:20:24 Cart 1 finishes unloading (payload=0).
22:20:24 Job 21 succeeded.
Scheduled: 52 jobs
Completed: 50
Failed: 2 jobs
  [12,11]
Simulation ended.
~~~
