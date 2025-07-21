function renderLoop(){
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);

  if(staticBackground) {staticBackground.render();}
  
  ctx.translate(camera.position.x, camera.position.y);

  // Render behind background layers
  background.renderBehind();

  // Render all collision blocks
  for(let i in allCollisionBlocks) {
    allCollisionBlocks[i].render();
  };

  // Render all interactable areas
  for(let i in allInteractableAreas) {
    allInteractableAreas[i].render();
  };

  // Render objects
  for(let i in match.objects) {
    match.objects[i].render();
  };

  // Render users behind
  for(let i in users) {
    userOnlinePlayerRender(users[i]);
  };

  // Render selectable players
  for(let i in selectablePlayers) {
    if(!selectablePlayers[i].selected){selectablePlayers[i].render();}
  };

  // Render player
  if(player.loaded) {player.render();}

  // Render particles
  for(let i in allParticles) {
    allParticles[i].render();
  };

  // Render front background layers
  background.renderFront();

  switch(match.state) {
    case "choosing":
      // Render object box
      box.render();

      // Render objects in box
      for(let i in box.objects) {
        box.objects[i].renderInChoosing();
      };
      break;

    case "placing":
      // Render mouse
      mouse.render();

      // Render objects in box
      for(let i in box.objects) {
        box.objects[i].renderInPlacing();
      };
      break;

    case "playing":
      // Call function or trigger event for game over state
      break;
  };

  // Render users in front
  for(let i in users) {
    userCursorRender(users[i]);
  };

  ctx.restore();
}