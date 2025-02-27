// ==================================================
// Project Imports
// ==================================================

// App.jsx
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import * as THREE from 'three';

// ==================================================
// General Notes for Rosie AI
// ==================================================

// Note: In sandboxed environments, avoid using <form> elements and traditional
// form submissions as they may be blocked by security policies. Instead, use
// controlled components with direct event handlers (onClick, onChange, etc.).

// ==================================================
// ChatAIClass Definition
// ==================================================

// This module provides a class, ChatAIClass, which uses a ChatManager (provided externally) 
// to conduct a conversation with an AI. The AI's behavior is defined by a description string, 
// and the ChatAIClass offers a simple getResponse method to get AI responses.
// 
// This is AI is powered by Rosebud AI and is Rosebud's method to add in-game AI features.
//
// IMPORTANT NOTE:
// - Do not assume how ChatManager works beyond what is described here.
// - We only know that:
//   1. ChatManager is constructed by passing in a description string.
//   2. We can add messages by calling chatManager.addMessage('user', prompt).
//   3. We can get an AI-generated response by calling chatManager.getCharacterResponse('classify').
// - Any other assumptions about ChatManager internals or methods should not be made.
//
// This code can be used in any JS project by simply importing this class and using it.
//////////////////////////////////////////////////////////////

// Defines how the AI should behave. This should change to match the project. 
const AI_BEHAVIOR_DESCRIPTION = `
You are a witty and creative AI comedian assistant. Your job is to turn any topic or prompt 
into a clever comedic bit or joke. Keep responses concise and punchy, using wordplay, 
clever observations, and timing. Maintain a playful tone while being family-friendly.
Always structure your response as a short comedy bit or joke.
`;

/**
 * ChatAIClass:
 * 
 * This class is intended for non-technical users who want to interact with an AI system.
 * 
 * Usage:
 * 1. Create an instance of ChatAIClass:
 *    const chat = new ChatAIClass();
 * 
 * 2. Call getResponse(prompt) to get a response from the AI:
 *    const answer = await chat.getResponse("What is quantum computing?");
 *    console.log(answer);
 */

export class ChatAIClass {
    constructor() {
        // Directly create a new ChatManager instance with the AI behavior description.
        // We assume ChatManager is available globally or imported from elsewhere.
        this.chatManager = new ChatManager(AI_BEHAVIOR_DESCRIPTION);
    }

    /**
     * Generates a response from the AI based on the given prompt.
     *
     * @param {string} prompt - The user's input or question.
     * @returns {Promise<string>} - The AI's response as text.
     */
    async getResponse(prompt) {
        // Add the user's message to the conversation.
        this.chatManager.addMessage('user', prompt);

        // Ask the ChatManager for the AI's response and return it.
        const response = await this.chatManager.getCharacterResponse('classify');

        // Add the AI's message to the conversation so it has memory of it.
        this.chatManager.addMessage('assistant', response);

        return response;
    }
}

// ==================================================
// Main App Component with Three.js Scene
// ==================================================

const App = () => {
  const mountRef = useRef(null);
  const emojisRef = useRef([]);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const chatAI = useRef(new ChatAIClass());
  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    
    // Create emoji particles
    const emojis = ['😂', '🤣', '😄', '😅', '😆', '😊', '🤪', '😜'];
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 80;
      canvas.height = 80;
      context.font = '60px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(emoji, canvas.width/2, canvas.height/2);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.6
      });
      
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(1.2, 1.2, 1.2);
      
      // Random position
      sprite.position.x = Math.random() * 40 - 20;
      sprite.position.y = Math.random() * 40 - 20;
      sprite.position.z = Math.random() * 10 - 15;
      
      // Store initial Y position and speed for animation
      sprite.userData = {
        initialY: sprite.position.y,
        speed: 0.015 + Math.random() * 0.01
      };
      
      emojisRef.current.push(sprite);
      scene.add(sprite);
    }
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    // Handle window resizing
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = window.devicePixelRatio;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      renderer.setPixelRatio(pixelRatio);
      
      // Update camera position to maintain cube visibility
      camera.position.z = 5;
    };
    
    // Initial setup
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    handleResize(); // Call once to set initial dimensions
    window.addEventListener('resize', handleResize);
    
    // Create cube
    const geometry = new THREE.TorusGeometry(2, 0.5, 16, 100);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x6c63ff,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const torus = new THREE.Mesh(geometry, material);
    scene.add(torus);
    
    camera.position.z = 5;
    
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      torus.rotation.x += 0.002;
      torus.rotation.y += 0.002;
      torus.rotation.z += 0.001;
      
      // Animate emojis
      emojisRef.current.forEach(emoji => {
        emoji.position.y -= emoji.userData.speed;
        
        // Reset position when emoji goes below screen
        if (emoji.position.y < -20) {
          emoji.position.y = 20;
          emoji.position.x = Math.random() * 40 - 20;
        }
        
        // Add subtle horizontal movement
        emoji.position.x += Math.sin(emoji.position.y * 0.05) * 0.005;
        
        // Rotate emoji slightly
        emoji.rotation.z = Math.sin(emoji.position.y * 0.1) * 0.1;
      });
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      emojisRef.current.forEach(emoji => {
        emoji.material.map.dispose();
        emoji.material.dispose();
      });
      renderer.dispose();
    };
  }, []);
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div ref={mountRef} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
        }}>
          <h1 style={{ 
            fontSize: '2rem', 
            marginBottom: '2rem',
            textAlign: 'center',
            color: '#6c63ff'
          }}>
            AI Joke Generator
          </h1>
          
          {response && (
            <div style={{
              marginBottom: '2rem',
              minHeight: '100px',
              fontSize: '1.2rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}>
              {displayText}
            </div>
          )}
          
          <div style={{
            display: 'flex',
            gap: '1rem',
          }}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter any topic for a joke..."
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #333',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '1rem',
              }}
            />
            <button
              onClick={async () => {
                if (!prompt.trim() || isLoading) return;
                
                setIsLoading(true);
                setResponse('');
                setDisplayText('');
                
                try {
                  const result = await chatAI.current.getResponse(prompt);
                  setResponse(result);
                  
                  // Animated text reveal
                  let i = 0;
                  const intervalId = setInterval(() => {
                    if (i <= result.length) {
                      setDisplayText(result.slice(0, i));
                      i++;
                    } else {
                      clearInterval(intervalId);
                    }
                  }, 30);
                  
                } catch (error) {
                  console.error('Error:', error);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              style={{
                padding: '1rem 2rem',
                borderRadius: '8px',
                border: 'none',
                background: '#6c63ff',
                color: '#fff',
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? 'Thinking...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const container = document.getElementById('renderDiv');
const root = ReactDOM.createRoot(container);
root.render(<App />);
