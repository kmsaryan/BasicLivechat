import React, { useRef, useEffect } from 'react';

const VideoCall = ({ roomId, socket, onEndCall }) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);

    useEffect(() => {
        const configuration = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };

        const startCall = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                peerConnectionRef.current = new RTCPeerConnection(configuration);

                stream.getTracks().forEach(track => {
                    peerConnectionRef.current.addTrack(track, stream);
                });

                peerConnectionRef.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('ice-candidate', { candidate: event.candidate, roomId });
                    }
                };

                peerConnectionRef.current.ontrack = (event) => {
                    if (remoteVideoRef.current && event.streams[0]) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                };

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

                socket.emit('ready-for-call', { roomId });
            } catch (error) {
                console.error('Error starting video call:', error);
            }
        };

        startCall();

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }

            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }

            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
        };
    }, [roomId, socket]);

    const endCall = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        socket.emit('end-call', { roomId });
        onEndCall();
    };

    return (
        <div className="video-call-container">
            <div className="videos-grid">
                <div className="remote-video-container">
                    <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                </div>
                <div className="local-video-container">
                    <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
                </div>
            </div>
            <div className="video-controls">
                <button onClick={endCall} className="end-call-button">End Call</button>
            </div>
        </div>
    );
};

export default VideoCall;
