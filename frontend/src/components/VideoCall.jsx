import React, { useRef, useEffect } from 'react';

const VideoCall = ({ roomId, socket, onEndCall }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    // Configuration for STUN/TURN servers
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Add TURN servers for production
      ]
    };

    const startCall = async () => {
      try {
        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        localStreamRef.current = stream;
        
        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Create RTCPeerConnection
        peerConnectionRef.current = new RTCPeerConnection(configuration);
        
        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, stream);
        });
        
        // Handle ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', {
              candidate: event.candidate,
              roomId
            });
          }
        };
        
        // Handle incoming tracks (remote video)
        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
        
        // Listen for signaling messages
        socket.on('offer', async ({ offer }) => {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit('answer', { answer, roomId });
        });
        
        socket.on('answer', async ({ answer }) => {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        });
        
        socket.on('ice-candidate', async ({ candidate }) => {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        });
        
        // Initiate call if user is the caller
        socket.on('start-call', async ({ isCaller }) => {
          if (isCaller) {
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            socket.emit('offer', { offer, roomId });
          }
        });
        
        // Handle call ended
        socket.on('call-ended', () => {
          endCall();
        });
        
        // Signal ready to start the call
        socket.emit('ready-for-call', { roomId });
        
      } catch (error) {
        console.error('Error starting video call:', error);
      }
    };
    
    startCall();
    
    return () => {
      endCall();
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('start-call');
      socket.off('call-ended');
    };
  }, [roomId, socket]);
  
  const endCall = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Signal call ended
    socket.emit('end-call', { roomId });
    
    // Notify parent component
    onEndCall();
  };

  return (
    <div className="video-call-container">
      <div className="videos-grid">
        <div className="remote-video-container">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline
            className="remote-video" 
          />
        </div>
        <div className="local-video-container">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted
            className="local-video" 
          />
        </div>
      </div>
      
      <div className="video-controls">
        <button onClick={endCall} className="end-call-button">
          End Call
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
