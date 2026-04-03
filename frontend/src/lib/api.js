import { axiosInstance } from "./axios"

// Auth API functions
export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData)
  if (response.data.token) {
    localStorage.setItem("token", response.data.token)
  }
  return response.data
}

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData)
  if (response.data.token) {
    localStorage.setItem("token", response.data.token)
  }
  return response.data
}

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout")
  localStorage.removeItem("token")
  return response.data
}

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me")
    return res.data
  } catch (error) {
    console.log("Error in getAuthUser:", error)
    return null
  }
}

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData)
  return response.data
}

export const updateUserProfile = async (profileData) => {
  const response = await axiosInstance.put("/auth/update-profile", profileData)
  return response.data
}

export const addFace = (formData) =>
  axiosInstance.post('/face-auth/add-face', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const loginWithFace = async (formData) => {
  const response = await axiosInstance.post('/face-auth/login-with-face', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (response.data.token) {
    localStorage.setItem("token", response.data.token)
  }
  return response;
};

export const sendOTP = async (phone) => {
  const response = await axiosInstance.post("/auth/send-otp", phone)
  return response.data
}

export const resendOTP = async (email) => {
  const response = await axiosInstance.post("/auth/resend-otp", { email })
  return response.data
}

export const verifyOTP = async (data, otp) => {
  const response = await axiosInstance.post("/auth/verify-otp", { ...data, otp })
  return response.data
}

export const resetPassword = async (data, newPassword) => {
  const response = await axiosInstance.post("/auth/reset-password", { ...data, newPassword })
  return response.data
}

// User API functions
export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends")
  return response.data
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users")
  return response.data
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests")
  return response.data
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`)
  return response.data
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests")
  return response.data
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`)
  return response.data
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token")
  return response.data
}

// Post API functions
export async function getAllPosts() {
  const response = await axiosInstance.get("/post/get-post")
  return response.data
}

export async function createPost(postData) {
  const response = await axiosInstance.post("/post/create-post", postData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return response.data
}

export async function updatePost(postId, formData) {
  const response = await axiosInstance.put(`/post/update-post/${postId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return response.data
}

export async function deletePost(postId) {
  const response = await axiosInstance.delete(`/post/delete-post/${postId}`)
  return response.data
}

export async function togglePostLike(postId) {
  return await axiosInstance.post(`/post/${postId}/like`).then((res) => res.data)
}

export async function getPostsByUserId(userId) {
  try {
    console.log("[v0] getPostsByUserId called with userId:", userId)
    const allPosts = await getAllPosts()
    console.log("[v0] getAllPosts returned:", allPosts)
    console.log("[v0] Total posts count:", allPosts?.length)

    if (allPosts && allPosts.length > 0) {
      console.log("[v0] First post structure:", allPosts[0])
      console.log("[v0] First post author:", allPosts[0]?.author)
      console.log("[v0] First post author._id:", allPosts[0]?.author?._id)
    }

    const filteredPosts = allPosts.filter((post) => {
      const authorId = post.author?._id
      console.log("[v0] Comparing:", authorId, "===", userId, "Result:", authorId === userId)
      return authorId === userId
    })

    console.log("[v0] Filtered posts:", filteredPosts)
    console.log("[v0] Filtered posts count:", filteredPosts.length)

    return filteredPosts
  } catch (error) {
    console.error("Error fetching user posts:", error)
    throw error
  }
}



export const addViewToPost = async (postId) => {
  const res = await axiosInstance.post(`/posts/${postId}/views`);
  return res.data;
};

export const getPostViews = async (postId) => {
  const res = await axiosInstance.get(`/posts/${postId}/views`);
  return res.data;
};


// AI API functions
export async function aiPrompt(prompt) {
  const response = await axiosInstance.post("/ai/get-response/", { prompt })
  return response.data
}

// CV API functions
export const generateCV = async (cvData) => {
  const res = await axiosInstance.post("/cv/generate", cvData)
  return res.data.cv
}

export const getCV = async (userId) => {
  const res = await axiosInstance.get(`/cv/get-cv/${userId}`)
  return res.data
}

export const updateCV = async ({ _id, updatedData }) => {
  const response = await axiosInstance.put(`/cv/update/${_id}`, updatedData)
  return response.data
}

export const deleteCV = async ({ cvId }) => {
  const token = localStorage.getItem("token")
  const res = await axiosInstance.delete(`/cv/delete/${cvId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return res.data
}

// Comment API functions
export async function addComment({ postId, commentData }) {
  const response = await axiosInstance.post(`/comment/add-comments/${postId}`, commentData)
  return response.data
}

export async function getCommentsByPost(postId) {
  const response = await axiosInstance.get(`/comment/get-comments/${postId}`)
  return response.data
}

export async function toggleCommentLike({ postId, commentId }) {
  const response = await axiosInstance.put(`/comment/like-comment/${postId}/${commentId}`);
  return response.data;
}


// Roadmap API functions
export const createRoadmap = async (payload) => {
  const { text: goal, userId, topic, level } = payload.data
  const response = await axiosInstance.post("/roadmap/create-roadmap", {
    goal,
    topic,
    level,
    userId,
  })
  return response.data
}

export const getRoadmap = async (userId) => {
  const response = await axiosInstance.get(`/roadmap/get-roadmap/${userId}`)
  return response.data
}

export const deleteRoadmap = async (roadmapId) => {
  const response = await axiosInstance.delete(`/roadmap/delete-roadmap/${roadmapId}`)
  return response.data
}

// Interview API functions
export const createInterview = async (interviewData) => {
  const response = await axiosInstance.post("/interview", interviewData)
  return response.data
}

export const getInterviews = async (userId) => {
  const response = await axiosInstance.get(`/interview/user/${userId}`)
  return response.data
}

export const startInterview = async (interviewId) => {
  const response = await axiosInstance.patch(`/interview/${interviewId}/start`)
  return response.data
}

export const endInterview = async (interviewId) => {
  const response = await axiosInstance.patch(`/interview/${interviewId}/end`)
  return response.data
}

export const submitAnswer = async (answerData) => {
  const response = await axiosInstance.post("/interview/answer", answerData)
  return response.data
}

export const deleteInterview = async (interviewId) => {
  const response = await axiosInstance.delete(`/interview/${interviewId}`)
  return response.data
}

// Results API functions
export const getInterviewResults = async (interviewId) => {
  const response = await axiosInstance.get(`/results/${interviewId}`)
  return response.data
}

export const getUserResults = async (userId) => {
  const response = await axiosInstance.get(`/results/user/${userId}`)
  return response.data
}

export const deleteUserResults = async (resultId) => {
  const response = await axiosInstance.delete(`/results/delete/${resultId}`)
  return response.data
}


export const createTicket = async (formData) => {
  const res = await axiosInstance.post("/ticket/create-ticket", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};



export const getTicket = async () => {
  const res = await axiosInstance.get("/ticket/tickets")
  return res.data
}

export const getTicketById = async (id) => {
  const res = await axiosInstance.get(`/ticket/tickets/${id}`);
  return res.data.ticket;
};

export const deleteTicket = async (ticketId) => {
  const res = await axiosInstance.delete(`/ticket/tickets/${ticketId}`);
  return res.data;
};

export const addSolutionToTicket = async (ticketId, solutionText) => {
  const res = await axiosInstance.post(`/ticket/add-solution/${ticketId}`, { solutionText });
  return res.data;
};


export const addUserToLeaderboard = async (userId, ticketId) => {
  const res = await axiosInstance.post("/leaderboard/adduser-leaderboard-post", { userId, ticketId });
  return res.data;
};


export const getLeaderboardData = async () => {
  const res = await axiosInstance.get("/leaderboard/leaderboard-get");
  return res.data;
};



// Chatbot API functions
export const createChatbotMessage = async ({ userId, message }) => {
  if (!userId) throw new Error("User ID is required")
  const response = await axiosInstance.post("/chatbot/chatbot-message", { userId, message })
  return response.data
}

export const getChatById = async (chatId) => {
  if (!chatId) throw new Error("Chat ID is required")
  const response = await axiosInstance.get(`/chatbot/chats/${chatId}`)
  return response.data
}

export const getUserChats = async (userId) => {
  if (!userId) throw new Error("User ID is required")
  const response = await axiosInstance.get(`/chatbot/users/${userId}/chats`)
  return response.data
}

export const updateChatTitle = async (chatId, title) => {
  if (!chatId) throw new Error("Chat ID is required")
  const response = await axiosInstance.patch(`/chatbot/chats/${chatId}/title`, { title })
  return response.data
}

export const deleteChat = async (chatId) => {
  if (!chatId) throw new Error("Chat ID is required")
  const response = await axiosInstance.delete(`/chatbot/chats/${chatId}`)
  return response.data
}

// Admin API functions
export const getAllUsers = async () => {
  const res = await axiosInstance.get("/admin/users")
  return res.data
}

export const getUserById = async (id) => {
  const res = await axiosInstance.get(`/admin/user/${id}`)
  return res.data
}

export const deleteUserById = async (id) => {
  const res = await axiosInstance.delete(`/admin/user/${id}`)
  return res.data
}

export const createUser = async (userData) => {
  const res = await axiosInstance.post("/admin/user", userData)
  return res.data
}


// 🔹 Posts
export const getAllPostsAdmin = async () => {
  const res = await axiosInstance.get("/admin/posts")
  return res.data.posts
}

// 🔹 Roadmaps
export const getAllRoadmaps = async () => {
  const res = await axiosInstance.get("/admin/roadmaps")
  return res.data.roadmaps
}

// 🔹 CVs
export const getAllCvs = async () => {
  const res = await axiosInstance.get("/admin/cvs")
  return res.data.cvs
}

// 🔹 Interviews
export const getAllInterviews = async () => {
  const res = await axiosInstance.get("/admin/interviews")
  return res.data.interviews
}


export const getAllTickets = async () => {
  const res = await axiosInstance.get("/admin/tickets")
  return res.data.tickets
}


// create contact
export const createContact = async (data) => {
  const res = await axiosInstance.post("/contact", data);
  return res.data;
};

// admin contacts
export const getAdminContacts = async () => {
  const res = await axiosInstance.get("/contact/get-contacts");
  return res.data.data;
};

// update contact status
export const updateContactStatus = async ({ id, status }) => {
  const res = await axiosInstance.put(`/contact/${id}/status`, { status });
  return res.data;
};

// user contacts
export const getUserContacts = async (userId) => {
  const res = await axiosInstance.get(`/contact/user/contacts/${userId}`);
  return res.data.data;
};

// delete contact
export const deleteContact = async (id) => {
  const res = await axiosInstance.delete(`/contact/${id}`);
  return res.data;
};


export const toggleBanUser = async ({ userId, isBanned, reason }) => {
  const res = await axiosInstance.put(`/users/ban-user/${userId}`, { isBanned, reason });
  return res.data;
};

// Get banned users (for admin)
export const getBannedUsers = async () => {
  const res = await axiosInstance.get("/users/banned-users");
  return res.data.bannedUsers;
};


export const activateSubscription = async (plan) => {
  const res = await axiosInstance.post("/payment/subscribe", { plan });
  return res.data;
};

// USER cancel
export const cancelSubscription = async () => {
  const res = await axiosInstance.post("/payment/cancel-payment");
  return res.data;
};

// ADMIN clear subscription of a user
export const clearSubscriptionByAdmin = async (userId) => {
  const res = await axiosInstance.post(`/payment/admin/clear/${userId}`);
  return res.data;
};


export const uploadResume = async (formData) => {
  const res = await axiosInstance.post("/resumes/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Analyze Resume (text based)
export const analyzeResume = async ({ resumeText, jobDescription }) => {
  const res = await axiosInstance.post(`/resumes/analyze`, {
    resumeText,
    jobDescription,
  });
  return res.data;
};

// Get all reports
export const getReports = async () => {
  const res = await axiosInstance.get("/resumes");
  return res.data;
};

// Get report by ID
export const getReportById = async (id) => {
  const res = await axiosInstance.get(`/resume/${id}`);
  return res.data;
};




// Ask Jarvis a question
export const askJarvis = async (question) => {
  const response = await axiosInstance.post("/jarvis/ask", { question });
  return response.data; // { answer: "...", userData?, sessionId? }
};

// Get conversation history
export const getJarvisConversations = async () => {
  const response = await axiosInstance.get("/jarvis/conversations");
  return response.data; // array of conversations
};

export const deleteConversation = async (sessionId) => {
  const response = await axiosInstance.delete(`/jarvis/conversations/${sessionId}`);
  return response.data; // { message: "Conversation deleted" }
};


export const addReview = async (reviewData) => {
  const response = await axiosInstance.post("/reviews", reviewData);
  return response.data;
};

// Get Reviews
export const getReviews = async () => {
  const response = await axiosInstance.get("/reviews");
  return response.data;
};

// Delete Review
export const deleteReview = async (reviewId) => {
  const response = await axiosInstance.delete(`/reviews/${reviewId}`);
  return response.data;
};
