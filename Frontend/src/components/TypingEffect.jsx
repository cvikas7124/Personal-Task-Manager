import React, { useEffect, useState } from "react";

const TypingEffect = () => {
  // List of phrases that will be typed out and deleted one after another
  const phrases = [
    "Manage your tasks easily ",
    "Stay organized and productive ",
    "Never miss a reminder ",
    "Plan your day like a pro ",
  ];

  // Variables to keep track of the current state
  const [text, setText] = useState(""); // The text currently displayed on screen
  const [phraseIndex, setPhraseIndex] = useState(0); // Which phrase we're currently showing (0,1,2,3)
  const [charIndex, setCharIndex] = useState(0); // How many characters of the current phrase we're showing
  const [isDeleting, setIsDeleting] = useState(false); // Whether we're currently typing or deleting

  useEffect(() => {
    // Get the phrase we're currently working with
    const currentPhrase = phrases[phraseIndex];
    // Typing is slower than deleting for a more natural effect
    let typingSpeed = isDeleting ? 50 : 100; // Deleting is faster (50ms) than typing (100ms)

    // Set up a timer to create the typing effect
    const timer = setTimeout(() => {
      // TYPING MODE: If we're not deleting, we're typing characters one by one
      if (!isDeleting) {
        // Take the phrase up to the current character and display it
        setText(currentPhrase.substring(0, charIndex + 1));
        // Move to the next character
        setCharIndex(charIndex + 1);

        // If we've typed the entire phrase, pause for a second before starting to delete
        if (charIndex + 1 === currentPhrase.length) {
          setTimeout(() => setIsDeleting(true), 1000); // Wait 1 second before deleting
        }
      }
      // DELETING MODE: Remove characters one by one
      else {
        // Take the phrase but show one fewer character
        setText(currentPhrase.substring(0, charIndex - 1));
        // Move back one character
        setCharIndex(charIndex - 1);

        // If we've deleted the whole phrase, switch back to typing mode and move to next phrase
        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setPhraseIndex((phraseIndex + 1) % phrases.length); // Move to next phrase (loops back to start when done)
        }
      }
    }, typingSpeed);

    // Clean up the timer when component unmounts or effect reruns
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex, phrases]); // Run this effect when any of these values change

  // Render the text with a blinking cursor at the end
  return (
    <h4 style={{ minHeight: "40px", marginBottom: "20px" }}>
      {text}
      <span className="blinking-cursor">|</span>{" "}
      {/* The vertical bar that blinks like a cursor */}
    </h4>
  );
};

export default TypingEffect;
