import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

const UPLOADS = process.env.REACT_APP_SOCKET_URL || 'https://chatapp-sim5.onrender.com';

export default function UserProfileModal({ userId, onClose, onStartChat }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);

  const { user: currentUser, updateUser } = useAuth();
  const { createConversation, selectConversation } = useChat();

  const isBlocked = currentUser.blockedUsers?.includes(userId);

  useEffect(() => {
    userAPI.getUserById(userId)
      .then(({ data }) => setProfile(data.user))
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false));
  }, [userId]);


  const handleStartChat = async () => {
    try {
      const conv = await createConversation({
        participantId: userId
      });

      selectConversation(conv);
      onClose();
      onStartChat?.();

    } catch {
      toast.error('Could not open chat');
    }
  };


  const handleBlock = async () => {
    setBlocking(true);

    try {
      const { data } = await userAPI.blockUser(userId);

      updateUser({
        blockedUsers: data.blockedUsers
      });

      toast.success(
        data.blocked
          ? `Blocked ${profile.username}`
          : `Unblocked ${profile.username}`
      );

    } catch {
      toast.error('Action failed');

    } finally {
      setBlocking(false);
    }
  };


  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >

      <div
        className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 w-full max-w-sm"
        onClick={(e)=>e.stopPropagation()}
      >


        {/* Banner */}
        <div className="h-28 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-t-2xl relative z-0">

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition text-sm"
          >
            ✕
          </button>

        </div>



        {loading ? (

          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"/>
          </div>


        ) : profile ? (


          <div className="px-6 pb-6">


            {/* Avatar */}
            <div className="flex items-end justify-between -mt-10 mb-4 relative z-20">


              <div className="ring-4 ring-gray-900 rounded-full bg-gray-900 relative z-30">

                {
                  profile.profilePicture ? (

                    <img
                      src={
                        profile.profilePicture.startsWith('http')
                        ? profile.profilePicture
                        : `${UPLOADS}${profile.profilePicture}`
                      }
                      alt={profile.username}
                      className="w-20 h-20 rounded-full object-cover"
                    />

                  ) : (

                    <Avatar user={profile} size="xl"/>

                  )
                }

              </div>



              <div className="flex items-center gap-1.5 mb-1">

                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    profile.isOnline
                    ? 'bg-emerald-400'
                    : 'bg-gray-500'
                  }`}
                />

                <span className="text-xs text-gray-400">
                  {
                    profile.isOnline
                    ? 'Online'
                    : 'Offline'
                  }
                </span>

              </div>


            </div>




            {/* User info */}

            <h2 className="text-xl font-bold text-white">
              {profile.username}
            </h2>


            <p className="text-sm text-gray-400 mt-0.5">
              {profile.email}
            </p>




            {/* Bio */}

            {
              profile.bio && (

                <div className="mt-4 bg-gray-800 rounded-xl px-4 py-3">

                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                    Bio
                  </p>

                  <p className="text-sm text-gray-200 leading-relaxed">
                    {profile.bio}
                  </p>

                </div>

              )
            }





            {/* Stats */}

            <div className="mt-3 bg-gray-800 rounded-xl px-4 py-3 space-y-2">


              {
                !profile.isOnline && profile.lastSeen && (

                  <div className="flex justify-between">

                    <span className="text-xs text-gray-500">
                      Last seen
                    </span>


                    <span className="text-xs text-gray-300">
                      {
                        format(
                          new Date(profile.lastSeen),
                          'MMM d, yyyy · HH:mm'
                        )
                      }
                    </span>

                  </div>

                )
              }



              <div className="flex justify-between">

                <span className="text-xs text-gray-500">
                  Member since
                </span>


                <span className="text-xs text-gray-300">

                  {
                    format(
                      new Date(profile.createdAt),
                      'MMM yyyy'
                    )
                  }

                </span>

              </div>


            </div>






            {/* Buttons */}

            {
              userId !== currentUser._id && (

                <div className="mt-4 flex gap-2">


                  <button
                    onClick={handleStartChat}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                  >
                    Message
                  </button>



                  <button
                    onClick={handleBlock}
                    disabled={blocking}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${
                      isBlocked
                      ? 'border-emerald-500/50 text-emerald-400'
                      : 'border-red-500/50 text-red-400'
                    }`}
                  >

                    {
                      blocking
                      ? '...'
                      : isBlocked
                      ? 'Unblock'
                      : 'Block'
                    }

                  </button>


                </div>

              )
            }



          </div>


        ) : (


          <div className="text-center py-10 text-gray-500 text-sm">
            User not found
          </div>


        )}


      </div>


    </div>
  );
}