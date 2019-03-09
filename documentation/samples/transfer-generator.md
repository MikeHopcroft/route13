# Transfer Generator Sample

This is an example of a synthetic generator that produces `TransferJob` events
for a synthetic schedule of random arrivals and departures.

In this example, there are 20 randomly timed arrivals between 12am and 8am, and
each arrival turns around and departs one hour later. Arrivals are assigned berths
and then random transfer jobs are generated for arrival-departure pairs that
allow at least 30 minutes for connections.

The output shows, for each berth, the schedule of arrivals and departures, along
with the associated `TransferJobs`.

~~~
% node build/samples/transfer-generator-sample.js

Allocated 5 berths.
20 arrival-departure pairs.
30 jobs.


Berth 0
  Inbound #15 at 00:05 => Outbound #35 at 01:05
    Job 22: move 1 items from 0 to 2 between 00:05 and 01:39 (01:33)
  Inbound #11 at 01:13 => Outbound #31 at 02:13
  Inbound #10 at 03:01 => Outbound #30 at 04:01
    Job 17: move 3 items from 0 to 3 between 03:01 and 03:34 (00:32)
  Inbound #16 at 04:45 => Outbound #36 at 05:45
    Job 23: move 2 items from 0 to 1 between 04:45 and 05:22 (00:36)
    Job 24: move 5 items from 0 to 3 between 04:45 and 05:39 (00:53)
    Job 25: move 1 items from 0 to 4 between 04:45 and 05:46 (01:00)
  Inbound #19 at 05:50 => Outbound #39 at 06:50
    Job 29: move 4 items from 0 to 1 between 05:50 and 06:51 (01:01)
  Inbound #6 at 07:32 => Outbound #26 at 08:32
    Job 11: move 4 items from 0 to 2 between 07:32 and 08:07 (00:35)

Berth 1
  Inbound #1 at 00:22 => Outbound #21 at 01:22
    Job 0: move 3 items from 1 to 0 between 00:22 and 01:05 (00:42)
    Job 1: move 2 items from 1 to 2 between 00:22 and 01:39 (01:16)
  Inbound #18 at 02:13 => Outbound #38 at 03:13
    Job 28: move 2 items from 1 to 3 between 02:13 and 03:34 (01:21)
  Inbound #4 at 04:22 => Outbound #24 at 05:22
    Job 7: move 4 items from 1 to 2 between 04:22 and 04:59 (00:37)
    Job 8: move 3 items from 1 to 3 between 04:22 and 05:39 (01:16)
    Job 9: move 2 items from 1 to 0 between 04:22 and 05:45 (01:23)
  Inbound #13 at 05:51 => Outbound #33 at 06:51
    Job 19: move 4 items from 1 to 0 between 05:51 and 06:50 (00:58)

Berth 2
  Inbound #14 at 00:39 => Outbound #34 at 01:39
    Job 20: move 5 items from 2 to 1 between 00:39 and 01:22 (00:43)
    Job 21: move 5 items from 2 to 3 between 00:39 and 01:39 (01:00)
  Inbound #7 at 01:43 => Outbound #27 at 02:43
    Job 12: move 4 items from 2 to 3 between 01:43 and 03:34 (01:50)
  Inbound #0 at 03:59 => Outbound #20 at 04:59
  Inbound #8 at 07:07 => Outbound #28 at 08:07
    Job 13: move 1 items from 2 to 4 between 07:07 and 07:54 (00:46)

Berth 3
  Inbound #9 at 00:39 => Outbound #29 at 01:39
    Job 14: move 5 items from 3 to 1 between 00:39 and 01:22 (00:43)
    Job 15: move 3 items from 3 to 2 between 00:39 and 01:39 (00:59)
    Job 16: move 3 items from 3 to 0 between 00:39 and 02:13 (01:33)
  Inbound #2 at 02:34 => Outbound #22 at 03:34
    Job 2: move 2 items from 3 to 1 between 02:34 and 03:13 (00:38)
    Job 3: move 2 items from 3 to 0 between 02:34 and 04:01 (01:27)
  Inbound #17 at 04:39 => Outbound #37 at 05:39
    Job 26: move 2 items from 3 to 1 between 04:39 and 05:22 (00:43)
    Job 27: move 4 items from 3 to 4 between 04:39 and 05:46 (01:07)
  Inbound #12 at 07:53 => Outbound #32 at 08:53
    Job 18: move 5 items from 3 to 0 between 07:53 and 08:32 (00:38)

Berth 4
  Inbound #3 at 04:46 => Outbound #23 at 05:46
    Job 4: move 5 items from 4 to 1 between 04:46 and 05:22 (00:35)
    Job 5: move 3 items from 4 to 3 between 04:46 and 05:39 (00:52)
    Job 6: move 2 items from 4 to 0 between 04:46 and 05:45 (00:59)
  Inbound #5 at 06:54 => Outbound #25 at 07:54
    Job 10: move 2 items from 4 to 2 between 06:54 and 08:07 (01:13)
~~~
