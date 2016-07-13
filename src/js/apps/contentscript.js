/*
 * apps/contentscript.js
 */

import Agent from '../libs/Agent';

/**
 * LinkBlanker agent.
 */
window.LinkBlankerAgent = new Agent(window, chrome);
