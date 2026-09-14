# Gantt dependency delay

Approved design: A's recorded delay remains red after A. A dependent B displays the same number of yellow days before its blue schedule, which shifts without changing duration. Direct pairs only; no recursive propagation. Center anchors match the creation viewer. Both support and contractor use the shared component. Original database schedules stay intact.

- [ ] Add a pure direct-dependency calculation and regression tests.
- [ ] Apply derived bars and centered connectors to the shared supervision view and align the fallback viewer.
- [ ] Typecheck and verify synthetic rendered fixtures for both roles; no production writes.
