tick 5 times a second

two methods
  
  script
    script is generated every 10 seconds for the next 10 seconds
    script builds what enemies will spawn at what tick and what X
    script is sent to all users at that tick
  movement
    user presses left
      sends event to server
        {event:left_down,tick:13782}
      server processes 
        if the tick is less than 6 ticks ago, process it and lerp 
        else send message back to user and deny and die
      server sends everyone message at tick, everyone lerps 
    user shoots
      sends event to server
        {event:shoot_down,tick:13782}

      server processes
        if the tick is less than 6 ticks ago, process it and lerp 
        else send message back to user and deny and die
        server sends everyone message at tick, everyone lerps 


        server shoots bullet
        determines at what tick it will hit enemy
        hurts enemy accordingly
    every 3 ticks server reconciles all enemy and player damage and sends out update
    
    enemy movement and shoots
      predetermined by script
      ticks on server and client
      all clients reconcile health using collision detection
      server updates periodically
      --no user or enemy can die without the server saying so--
      
      
    when a new user joins
      his X is chosen by server
      all players are sent event
        {event:new_player, tick:123748} (now plus 2 seconds)
      he recieves all player locations
      he receives script
      game starts