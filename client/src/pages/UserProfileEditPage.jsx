import React from 'react'
import { useLocation ,useNavigate} from 'react-router-dom'
import userService from '../services/userService'

function UserProfileEditPage() {
    const location = useLocation()
    const userData = location.state.profileData
    const [error,setError]=React.useState(null);
    const navigate=useNavigate();   
    const [userProfile,setUserProfile]=React.useState(
        {
            id:userData._id,
            fullName:userData.fullName,
            username:userData.username,
            role:userData.role,
            password:'',
            confirmPassword:''
        }
    )

    const handleSubmit=(e)=>{
        e.preventDefault();

        if(userProfile.password !== userProfile.confirmPassword){
            setError("Passwords do not match!");
            return;
        }
        try {
            userService.updateOtherProfile(userProfile)
             .then(()=>{
                 setError(null);
                 setUserProfile({
                    password:'',
                    confirmPassword:'',
                    fullName:'',
                    username:'',
                    role:'',
                    id:''
                });
                navigate('/admin/users');
                 
             })
            
        } catch(error){
                 setError("Failed to update profile. Please try again.");
            }
    }
    //to edit ther users profile 
  return (
    <div>
        <form className="space-y-4 max-w-md mx-auto mt-3 p-6 bg-white rounded-lg shadow-md" onSubmit={handleSubmit}>
            <h1 className="text-2xl font-bold mb-4 text-center">Edit User Profile</h1>
            <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input 
                    type="text" 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                    value={userProfile.fullName}
                    onChange={(e)=>setUserProfile({...userProfile,fullName:e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input 
                    type="text" 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                    value={userProfile.username}
                    onChange={(e)=>setUserProfile({...userProfile,username:e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                    value={userProfile.role}
                    onChange={(e)=>setUserProfile({...userProfile,role:e.target.value})}
                >
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="staff">Staff</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input 
                    type="password" 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                    value={userProfile.password}
                    onChange={(e)=>setUserProfile({...userProfile,password:e.target.value})}
                />
                <input
                    type="password"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Confirm New Password"
                    value={userProfile.confirmPassword}
                    onChange={(e) => setUserProfile({ ...userProfile, confirmPassword: e.target.value })}
                />
            </div>
            {error && <div className='text-red-600 font-italic'>{error}</div>}
            <button 
                type="submit" 
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
            >
                Save Changes
            </button>
        </form>

    </div>
  )
}

export default UserProfileEditPage