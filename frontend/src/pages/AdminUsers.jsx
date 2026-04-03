"use client"

import { useEffect, useState } from "react"
import { Toaster, toast } from "react-hot-toast"
import { Eye, Ban, UserCheck, Trash2, Crown, Users, TrendingUp, CreditCard, Search, Filter, Download, Mail, Phone, Calendar, Shield, Sparkles, Target, BarChart3 } from "lucide-react"
import { useNavigate } from "react-router"
import { getAllUsers, deleteUserById, toggleBanUser } from "../lib/api"
import { useMutation } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterSubscription, setFilterSubscription] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [stats, setStats] = useState({
    totalUsers: 0,
    subscribedUsers: 0,
    monthlySubscriptions: 0,
    yearlySubscriptions: 0,
    freeUsers: 0,
    bannedUsers: 0,
    adminUsers: 0
  })

  const navigate = useNavigate()

  const { mutate: banMutation, isPending: isBanPending } = useMutation({
    mutationFn: toggleBanUser,
    onSuccess: (data) => {
      toast.success(data.message)
      setUsers(users.map((user) => user._id === data.user._id ? data.user : user))
    },
    onError: () => {
      toast.error("Failed to update user ban status")
    }
  })

  const calculateStats = (users) => {
    const totalUsers = users.length
    const subscribedUsers = users.filter(user => user.subscription && user.subscription !== "free").length
    const monthlySubscriptions = users.filter(user => user.subscription === "monthly").length
    const yearlySubscriptions = users.filter(user => user.subscription === "yearly").length
    const freeUsers = users.filter(user => !user.subscription || user.subscription === "free").length
    const bannedUsers = users.filter(user => user.isBanned).length
    const adminUsers = users.filter(user => user.role === "admin").length

    return {
      totalUsers,
      subscribedUsers,
      monthlySubscriptions,
      yearlySubscriptions,
      freeUsers,
      bannedUsers,
      adminUsers
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await getAllUsers()
      if (Array.isArray(response.users)) {
        setUsers(response.users)
        setFilteredUsers(response.users)
        setStats(calculateStats(response.users))
      } else {
        setUsers([])
        setFilteredUsers([])
        toast.error("No users found.")
      }
    } catch (err) {
      console.error("API Error:", err)
      setUsers([])
      setFilteredUsers([])
      toast.error("Failed to fetch users.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      )
    }

    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter(user => user.role === filterRole)
    }

    // Subscription filter
    if (filterSubscription !== "all") {
      filtered = filtered.filter(user => user.subscription === filterSubscription)
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(user => 
        filterStatus === "banned" ? user.isBanned : !user.isBanned
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, filterRole, filterSubscription, filterStatus])

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await deleteUserById(userId)
        const updatedUsers = users.filter((user) => user._id !== userId)
        setUsers(updatedUsers)
        setStats(calculateStats(updatedUsers))
        toast.success("User deleted successfully!")
      } catch (err) {
        console.error("Delete Error:", err)
        toast.error("Failed to delete user.")
      }
    }
  }

  const handleViewProfile = (userId) => {
    navigate(`/admin/user/${userId}`)
  }

  const handleToggleBan = (userId, isBanned) => {
    if (!isBanned) {
      const reason = prompt("Enter reason for banning this user:")
      if (!reason) return toast.error("Ban reason is required")
      if (!confirm(`Are you sure you want to ban this user?\nReason: ${reason}`)) return
      banMutation({ userId, isBanned: true, reason })
    } else {
      if (!confirm("Are you sure you want to unban this user?")) return
      banMutation({ userId, isBanned: false })
    }
  }

  const getSubscriptionBadge = (subscription) => {
    const badges = {
      free: "badge-ghost",
      monthly: "badge-primary",
      yearly: "badge-secondary"
    }
    return badges[subscription] || "badge-ghost"
  }

  const getSubscriptionText = (subscription) => {
    const texts = {
      free: "Free",
      monthly: "Monthly",
      yearly: "Yearly Pro"
    }
    return texts[subscription] || "Free"
  }

  const StatCard = ({ title, value, icon: Icon, color, description, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="card bg-base-100/80 backdrop-blur-xl shadow-2xl border border-base-300/30 rounded-2xl overflow-hidden"
    >
      <div className="card-body p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-base-content mb-1">{value}</p>
            <p className="text-sm text-base-content/60 font-semibold">{title}</p>
            {description && (
              <p className="text-xs text-base-content/40 mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('from-', 'text-').replace(' to-.*', '')}`} />
          </div>
        </div>
      </div>
    </motion.div>
  )

  const exportUsers = () => {
    const data = filteredUsers.map(user => ({
      Name: user.fullName,
      Email: user.email,
      Phone: user.phone || 'N/A',
      Role: user.role,
      Subscription: getSubscriptionText(user.subscription),
      Status: user.isBanned ? 'Banned' : 'Active',
      'Created At': new Date(user.createdAt).toLocaleDateString()
    }))
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success('Users exported successfully!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200/50 to-base-100 p-2 sm:p-4 lg:p-6 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(var(--b1), 0.95)',
            color: 'hsl(var(--bc))',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(var(--bc), 0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }}
      />
      
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-base-content/60 mt-2 text-lg">Manage all users and their subscriptions</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportUsers}
          className="btn btn-primary btn-lg gap-3 shadow-lg hover:shadow-xl"
          disabled={filteredUsers.length === 0}
        >
          <Download size={20} />
          Export Users
          <Sparkles size={16} />
        </motion.button>
      </motion.div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 lg:gap-6 mb-8">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users} 
          color="from-blue-500 to-cyan-500"
          index={0}
        />
        <StatCard 
          title="Subscribed" 
          value={stats.subscribedUsers} 
          icon={Crown} 
          color="from-green-500 to-emerald-500"
          description={`${stats.totalUsers ? Math.round((stats.subscribedUsers / stats.totalUsers) * 100) : 0}% of total`}
          index={1}
        />
        <StatCard 
          title="Monthly" 
          value={stats.monthlySubscriptions} 
          icon={TrendingUp} 
          color="from-purple-500 to-pink-500"
          index={2}
        />
        <StatCard 
          title="Yearly Pro" 
          value={stats.yearlySubscriptions} 
          icon={CreditCard} 
          color="from-orange-500 to-red-500"
          index={3}
        />
        <StatCard 
          title="Free Users" 
          value={stats.freeUsers} 
          icon={Users} 
          color="from-gray-500 to-slate-500"
          index={4}
        />
        <StatCard 
          title="Admins" 
          value={stats.adminUsers} 
          icon={Shield} 
          color="from-red-500 to-rose-500"
          index={5}
        />
        <StatCard 
          title="Banned" 
          value={stats.bannedUsers} 
          icon={Ban} 
          color="from-error to-red-700"
          index={6}
        />
      </div>

      {/* Enhanced Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-base-100/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-8 border border-base-300/30"
      >
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="flex-1 w-full lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/40 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-lg w-full pl-12 bg-base-200/50"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="select select-bordered select-md bg-base-200/50"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            
            <select 
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
              className="select select-bordered select-md bg-base-200/50"
            >
              <option value="all">All Subscriptions</option>
              <option value="free">Free</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly Pro</option>
            </select>
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select select-bordered select-md bg-base-200/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchTerm("")
                setFilterRole("all")
                setFilterSubscription("all")
                setFilterStatus("all")
              }}
              className="btn btn-ghost btn-md gap-2"
            >
              <Filter size={18} />
              Reset Filters
            </motion.button>
          </div>
        </div>
        
        {/* Results count */}
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-base-content/60 font-medium">
            Showing <span className="text-primary font-bold">{filteredUsers.length}</span> of <span className="font-bold">{users.length}</span> users
          </p>
          {searchTerm && (
            <p className="text-sm text-base-content/60">
              Search results for: <span className="text-primary font-semibold">"{searchTerm}"</span>
            </p>
          )}
        </div>
      </motion.div>

      {/* Enhanced Users Table */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-base-100/80 backdrop-blur-xl rounded-2xl shadow-lg border border-base-300/30"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="loading loading-spinner loading-lg text-primary mb-4"
          />
          <p className="text-base-content/60 text-lg">Loading users...</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-base-100/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-base-300/30"
        >
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="bg-base-200/50">
                <tr>
                  <th className="px-6 py-5 text-left font-bold text-base-content text-lg">User</th>
                  <th className="px-6 py-5 text-left font-bold text-base-content text-lg">Contact</th>
                  <th className="px-6 py-5 text-left font-bold text-base-content text-lg">Role</th>
                  <th className="px-6 py-5 text-left font-bold text-base-content text-lg">Subscription</th>
                  <th className="px-6 py-5 text-left font-bold text-base-content text-lg">Status</th>
                  <th className="px-6 py-5 text-left font-bold text-base-content text-lg">Joined</th>
                  <th className="px-6 py-5 text-left font-bold text-base-content text-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-base-200/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="avatar">
                              <div className="w-12 h-12 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100 transition-all group-hover:ring-secondary">
                                <img
                                  src={user.profilePic || "/placeholder.svg?height=48&width=48"}
                                  alt={user.fullName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-base-content text-lg">{user.fullName}</div>
                              <div className="text-sm text-base-content/60 font-mono">ID: {user._id.slice(-8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 text-base">
                              <Mail className="w-4 h-4 text-primary" />
                              <span className="text-base-content font-medium">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-3 text-base">
                                <Phone className="w-4 h-4 text-secondary" />
                                <span className="text-base-content/70">{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge badge-lg font-bold ${user.role === "admin" ? "badge-primary text-primary-content" : "badge-ghost"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <span className={`badge badge-lg font-bold ${getSubscriptionBadge(user.subscription)}`}>
                              {getSubscriptionText(user.subscription)}
                            </span>
                            {user.subscriptionExpiresAt && (
                              <div className="flex items-center gap-2 text-xs text-base-content/60">
                                <Calendar className="w-3 h-3" />
                                <span>Expires {new Date(user.subscriptionExpiresAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge badge-lg font-bold ${user.isBanned ? "badge-error text-error-content" : "badge-success text-success-content"}`}>
                            {user.isBanned ? "Banned" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-base text-base-content/60 font-medium">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleViewProfile(user._id)} 
                              className="btn btn-ghost btn-sm btn-circle text-info hover:bg-info/20"
                              title="View Profile"
                            >
                              <Eye size={18} />
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleToggleBan(user._id, user.isBanned)}
                              className={`btn btn-ghost btn-sm btn-circle ${user.isBanned ? "text-success hover:bg-success/20" : "text-error hover:bg-error/20"}`}
                              disabled={isBanPending}
                              title={user.isBanned ? "Unban User" : "Ban User"}
                            >
                              {user.isBanned ? <UserCheck size={18} /> : <Ban size={18} />}
                            </motion.button>
                            
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(user._id)} 
                              className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/20"
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center gap-4"
                        >
                          <Users className="w-16 h-16 text-base-content/30" />
                          <div>
                            <p className="text-base-content/60 text-lg font-semibold mb-2">No users found</p>
                            <p className="text-base-content/40 text-sm">Try adjusting your search or filters</p>
                          </div>
                          {(searchTerm || filterRole !== "all" || filterSubscription !== "all" || filterStatus !== "all") && (
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSearchTerm("")
                                setFilterRole("all")
                                setFilterSubscription("all")
                                setFilterStatus("all")
                              }}
                              className="btn btn-primary btn-sm gap-2"
                            >
                              <Filter size={16} />
                              Clear all filters
                            </motion.button>
                          )}
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
    </div>
  )
}

export default AdminUsers