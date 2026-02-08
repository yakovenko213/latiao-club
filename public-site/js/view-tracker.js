/**
 * 🔥 View Counter Module
 * 
 * Tracks page and category views using Firebase Firestore increment.
 * Uses sessionStorage to prevent multiple counts per session.
 * 
 * Usage:
 *   import './js/view-tracker.js'
 *   window.incrementViewCount('categories', 'spicy')
 *   window.incrementViewCount('pages', 'about')
 */

import { db } from './firebase-init.js'
import { doc, updateDoc, increment, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'

/**
 * Increment view count for a page or category
 * @param {string} collectionName - 'categories' or 'pages'
 * @param {string} docId - Document ID (slug)
 */
async function incrementViewCount(collectionName, docId) {
  if (!collectionName || !docId) {
    console.warn('⚠️ incrementViewCount: Missing collectionName or docId')
    return
  }

  // Create unique session key
  const sessionKey = `view_tracked_${collectionName}_${docId}`

  // Check if already tracked in this session
  if (sessionStorage.getItem(sessionKey)) {
    console.log(`✅ View already counted for ${collectionName}/${docId} in this session`)
    return
  }

  try {
    const docRef = doc(db, collectionName, docId)

    // First, check if document exists
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.warn(`⚠️ Document ${collectionName}/${docId} does not exist`)
      return
    }

    // Increment the viewCount field
    await updateDoc(docRef, {
      viewCount: increment(1)
    })

    // Mark as tracked in this session
    sessionStorage.setItem(sessionKey, 'true')

    console.log(`📊 View counted: ${collectionName}/${docId}`)
  } catch (error) {
    // If the field doesn't exist yet, create it with initial value
    if (error.code === 'not-found' || error.message.includes('FieldValue')) {
      try {
        const docRef = doc(db, collectionName, docId)
        await setDoc(docRef, { viewCount: 1 }, { merge: true })
        sessionStorage.setItem(sessionKey, 'true')
        console.log(`📊 View count initialized: ${collectionName}/${docId}`)
      } catch (retryError) {
        console.error(`❌ Failed to initialize view count for ${collectionName}/${docId}:`, retryError)
      }
    } else {
      console.error(`❌ Failed to increment view count for ${collectionName}/${docId}:`, error)
    }
  }
}

// Expose to global window object for easy access
window.incrementViewCount = incrementViewCount

export { incrementViewCount }
