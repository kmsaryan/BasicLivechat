import React, { useState, useEffect, useCallback } from 'react';
import '../styles/SuggestionsSection.css';

// Move these static objects outside the component to prevent unnecessary re-renders
const suggestionKeywords = {
    payment: ['payment', 'bill', 'invoice', 'pay', 'charge', 'subscription', 'cost'],
    technical: ['error', 'broken', "doesn't work", 'bug', 'issue', 'problem', 'crash', 'not working'],
    shipping: ['delivery', 'ship', 'package', 'track', 'order', 'arrive', 'shipping']
};

// Response templates mapped to categories
const responseTemplates = {
    payment: [
        "I can help you with your payment concern. Could you provide the invoice number?",
        "Would you like to review your payment history?",
        "Our payment methods include credit card, PayPal, and bank transfer."
    ],
    technical: [
        "Have you tried restarting the application?",
        "What browser/device are you currently using?",
        "Let me guide you through troubleshooting this issue step by step."
    ],
    shipping: [
        "To track your package, I'll need your order number.",
        "Standard shipping typically takes 3-5 business days.",
        "Would you like me to check the status of your delivery?"
    ],
    general: [
        "How else can I assist you today?",
        "Would you like me to connect you with a specialist?",
        "Is there anything else you'd like to know?"
    ]
};

const SuggestionsSection = ({ messageHistory = [], onSuggestionClick }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Use useCallback to prevent this function from being recreated on every render
    const analyzeSuggestions = useCallback(() => {
        // Only analyze when we have messages
        if (messageHistory.length === 0) {
            setSuggestions(responseTemplates.general);
            return;
        }

        // Get the last few messages to analyze context
        const recentMessages = messageHistory.slice(-3);
        const lastUserMessage = [...recentMessages].reverse().find(msg => !msg.isOwn && !msg.isSystem);
        
        if (!lastUserMessage) {
            setSuggestions(responseTemplates.general);
            return;
        }
        
        setIsLoading(true);
        
        // Simulating some processing time for suggestion generation
        setTimeout(() => {
            const text = lastUserMessage.text?.toLowerCase() || '';
            let matched = false;
            
            // Check for keyword matches
            for (const [category, keywords] of Object.entries(suggestionKeywords)) {
                if (keywords.some(keyword => text.includes(keyword))) {
                    setSuggestions(responseTemplates[category]);
                    matched = true;
                    break;
                }
            }
            
            if (!matched) {
                // Default suggestions when no specific category matches
                setSuggestions(responseTemplates.general);
            }
            
            setIsLoading(false);
        }, 300);
    }, [messageHistory]);

    useEffect(() => {
        analyzeSuggestions();
    }, [analyzeSuggestions]);

    if (!onSuggestionClick) {
        return null; // Don't show suggestions if they're not clickable
    }

    return (
        <div className="suggestions-section">
            <h4>Suggested Responses</h4>
            
            {isLoading ? (
                <div className="loading-suggestions">Analyzing conversation...</div>
            ) : (
                <div className="suggestions-list">
                    {suggestions.map((suggestion, index) => (
                        <button 
                            key={index}
                            className="suggestion-item"
                            onClick={() => onSuggestionClick(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuggestionsSection;
