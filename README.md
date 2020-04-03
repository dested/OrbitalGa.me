OrbitalCrash
======


Goals
===

* infinite horizontal world
* constantly scrolling forward
* server generated enemies, powerups, and events
* goal is to stay alive and generate the most points 
  * leaderboards


Todo
===

 * [x] determine screen size
    * [x] scaling
    * [x] cant go off the screen
    * [ ] warning when you go too far left?
    * [ ] keep everyone mostly near each other
 * [x] better kenney assets
 * [ ] add death effect
 * [ ] make sure disconnect and kill work
 * [x] shot explode effect
 * [ ] watch other shmups
 * [x] gun shooting offcenter when youre moving
 * [ ] leaderboard
    * [ ] redis
 * [x] add momentum to movement
 * [x] alternate left right on shot
 * [ ] take damage
    * [ ] die
 * [ ] add mouse movement
    * [ ] move rotate code from sonic
 * [x] binary transfer
 * [ ] make collision code better
 * [x] better background
 * [x] refactor code
     * [x] better separation
     * [ ] proper draw
     * [x] add better bounding box for collisions 
 * [ ] add powerups
 * [x] clean up serialize, worldstate, buffer builder
 * [ ] make it easier to add things, update worldstate automatically
 * [ ] come up with more enemies
 * [ ] come up with realtime events
    * [ ] big bosses every 5 min?
 * [x] add worldstate filtering
 * [x] build bots
 * [x] load test
 * [x] deploy to beanstalk
 * [x] add analytics to server to see users connected, enemies, etc
 * [x] determine how to scale up servers dynamically
    * [ ] add lambda for join/etc, checks redis for servers, spins one up?
 
