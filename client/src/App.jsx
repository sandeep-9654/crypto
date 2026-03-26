import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import TeamRoute from './guards/TeamRoute';
import AdminRoute from './guards/AdminRoute';
import MatrixRain from './components/MatrixRain';

// Pages
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import RoundComplete from './pages/RoundComplete';
import EventComplete from './pages/EventComplete';
import PublicLeaderboard from './pages/PublicLeaderboard';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeamApprovals from './pages/admin/TeamApprovals';
import TeamManager from './pages/admin/TeamManager';
import LiveMonitor from './pages/admin/LiveMonitor';
import ViolationLog from './pages/admin/ViolationLog';

// QM Page — lazy loaded, not in main bundle
const SystemConsole = lazy(() => import('./pages/admin/SystemConsole'));

const AppLoading = () => (
    <div className="min-h-screen bg-hacker-black flex items-center justify-center">
        <div className="text-neon-green font-mono">
            <span className="terminal-spinner"></span> INITIALIZING SYSTEM...
        </div>
    </div>
);

function App() {
    return (
        <Router>
            <AuthProvider>
                <SocketProvider>
                    <MatrixRain />
                    <Suspense fallback={<AppLoading />}>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<Landing />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/pending" element={<PendingApproval />} />
                            <Route path="/leaderboard" element={<PublicLeaderboard />} />

                            {/* Protected Team Routes */}
                            <Route path="/dashboard" element={<TeamRoute><Dashboard /></TeamRoute>} />
                            <Route path="/round-complete" element={<TeamRoute><RoundComplete /></TeamRoute>} />
                            <Route path="/complete" element={<TeamRoute><EventComplete /></TeamRoute>} />

                            {/* Admin Routes */}
                            <Route path="/admin/login" element={<AdminLogin />} />
                            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                            <Route path="/admin/approvals" element={<AdminRoute><TeamApprovals /></AdminRoute>} />
                            <Route path="/admin/teams" element={<AdminRoute><TeamManager /></AdminRoute>} />
                            <Route path="/admin/monitor" element={<AdminRoute><LiveMonitor /></AdminRoute>} />
                            <Route path="/admin/violations" element={<AdminRoute><ViolationLog /></AdminRoute>} />

                            {/* QM Route — dual-token protected, lazy loaded */}
                            <Route path="/ctrl/qmgr" element={<AdminRoute><SystemConsole /></AdminRoute>} />

                            {/* 404 */}
                            <Route path="*" element={
                                <div className="min-h-screen bg-hacker-black flex items-center justify-center text-neon-green font-mono">
                                    <div className="text-center">
                                        <h1 className="text-4xl mb-4">404</h1>
                                        <p className="opacity-50">{'>'} Route not found</p>
                                    </div>
                                </div>
                            } />
                        </Routes>
                    </Suspense>
                </SocketProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
