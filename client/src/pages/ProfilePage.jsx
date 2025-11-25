import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [fullName, setFullName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    // Load the logged-in user's profile
    useEffect(() => {
        userService.getProfile()
            .then((res) => {
                setUser(res.data);
                setFullName(res.data.fullName);
            })
            .catch(() => setError("Failed to load profile."))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Password validations
        if (newPassword && newPassword.length < 6) {
            return setError("New password must be at least 6 characters long.");
        }
        if (newPassword && newPassword !== confirmPassword) {
            return setError("New passwords do not match.");
        }
        if (newPassword && !currentPassword) {
            return setError("Enter your current password to change password.");
        }

        const updateData = {
            fullName,
        };

        if (newPassword) {
            updateData.currentPassword = currentPassword;
            updateData.newPassword = newPassword;
        }

        try {
            setLoading(true);
            const response = await userService.updateProfile(updateData);

            // Save new session data
            localStorage.setItem("user", JSON.stringify(response.data));
            setSuccess("Profile updated successfully!");

            // Reset form fields
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Redirect home
            setTimeout(() => navigate("/"), 1500);

        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p className="text-center mt-6 text-lg">Loading profile...</p>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h2>

            <form onSubmit={handleSubmit}>
                
                {/* Full Name */}
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                    <input
                        type="text"
                        className="border rounded-lg w-full p-3 focus:ring-2 focus:ring-pink-500"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                </div>

                {/* Password Section */}
                <h3 className="text-lg font-bold text-gray-700 border-b mb-4 pb-2">Change Password</h3>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Current Password</label>
                    <input
                        type="password"
                        className="border rounded-lg w-full p-3 focus:ring-2 focus:ring-pink-500"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Required if changing password"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
                    <input
                        type="password"
                        className="border rounded-lg w-full p-3 focus:ring-2 focus:ring-pink-500"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep old password"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Confirm New Password</label>
                    <input
                        type="password"
                        className="border rounded-lg w-full p-3 focus:ring-2 focus:ring-pink-500"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                    />
                </div>

                <button
                    type="submit"
                    className={`w-full bg-pink-500 text-white py-3 rounded-lg mt-4 hover:bg-pink-600 transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={loading}
                >
                    {loading ? "Saving..." : "Update Profile"}
                </button>

                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                {success && <p className="text-green-600 text-center mt-4">{success}</p>}
            </form>
        </div>
    );
};

export default ProfilePage;