// Socket Handler Client
// All socket event handlers are now managed by SocketHandler class
// This file is deprecated - handlers have been moved to src/network/SocketHandler.js
//
// Note: The socket references in sendData/*.js files still use the global 'socket'
// variable which is created by SocketHandler. For refactoring in Phase 4, these
// should be updated to use socketHandler.send() instead.
