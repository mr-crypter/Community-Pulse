import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { postsAPI } from '../services/api'
import toast from 'react-hot-toast'

const VoteButtons = ({ postId, initialUpvotes = 0, initialDownvotes = 0, initialUserVote = null }) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [userVote, setUserVote] = useState(initialUserVote)
  const [voting, setVoting] = useState(false)

  const handleVote = async (vote) => {
    if (voting) return

    setVoting(true)
    try {
      const response = await postsAPI.vote(postId, vote)
      
      setUpvotes(response.data.upvotes)
      setDownvotes(response.data.downvotes)
      setUserVote(response.data.userVote)
    } catch (error) {
      console.error('Vote failed:', error)
      if (error.response?.status === 401) {
        toast.error('Please log in to vote')
      } else {
        toast.error('Failed to vote')
      }
    } finally {
      setVoting(false)
    }
  }

  const netVotes = upvotes - downvotes

  return (
    <div className="flex items-center gap-1">
      {/* Upvote button */}
      <button
        onClick={() => handleVote(1)}
        disabled={voting}
        className={`
          p-1 rounded transition-all hover:bg-gray-100
          ${userVote === 1 ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}
          ${voting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Upvote"
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      {/* Vote count */}
      <span
        className={`
          text-sm font-semibold min-w-[2rem] text-center
          ${netVotes > 0 ? 'text-green-600' : netVotes < 0 ? 'text-red-600' : 'text-gray-600'}
        `}
      >
        {netVotes > 0 ? '+' : ''}{netVotes}
      </span>

      {/* Downvote button */}
      <button
        onClick={() => handleVote(-1)}
        disabled={voting}
        className={`
          p-1 rounded transition-all hover:bg-gray-100
          ${userVote === -1 ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}
          ${voting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Downvote"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  )
}

export default VoteButtons

