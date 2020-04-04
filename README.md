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

 * [ ] warning when you go too far left?
 * [ ] keep everyone mostly near each other
 * [ ] add death effect
 * [ ] make sure disconnect and kill work
 * [ ] watch other shmups
 * [ ] leaderboard
    * [ ] redis
 * [ ] take damage
    * [ ] die    
 * [ ] make collision code better
 * [ ] add powerups
 * [ ] come up with more enemies
 * [ ] come up with realtime events
    * [ ] big bosses every 5 min?
 * [ ] add lambda for join/etc, checks redis for servers, spins one up?
 * [ ] add login register
 * [ ] add leaderboard
 * [x] determine screen size
    * [x] scaling
    * [x] cant go off the screen
 * [x] better kenney assets
 * [x] shot explode effect
 * [x] gun shooting offcenter when youre moving
 * [x] add momentum to movement
 * [x] alternate left right on shot
 * [x] better mobile support
     * [x] add mouse movement
     * [x] add full screen rotate code
 * [x] binary transfer
 * [x] better background
 * [x] refactor code
     * [x] better separation
     * [x] proper draw
     * [x] add better bounding box for collisions 
 * [x] clean up serialize, worldstate, buffer builder
 * [x] make it easier to add things add entities and sync fields
 * [x] add worldstate filtering
 * [x] build bots
 * [x] load test
 * [x] deploy to beanstalk
 * [x] add analytics to server to see users connected, enemies, etc
 * [x] determine how to scale up servers dynamically
 
