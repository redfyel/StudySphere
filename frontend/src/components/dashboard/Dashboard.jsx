// Example component that needs to display the username

import React, { useContext } from 'react';
import { UserLoginContext } from '../../contexts/UserLoginContext'; // Correct path
import Loading from '../loading/Loading'

const Dashboard = () => {
    // Access the 'user' and 'isAuthenticated' state from the context
    const { user, isAuthenticated, isLoading } = useContext(UserLoginContext);

    // Show a loading state while the user data is being fetched
    if (isLoading) {
        return <Loading/>
    }

    // Check if the user is authenticated
    if (!isAuthenticated || !user) {
        // Handle unauthenticated state, e.g., redirect to login
        return <div>Please log in to view the dashboard.</div>;
    }

    // Access and display the username
    return (
        <div>
            <h2>Welcome, {user.username}!</h2>
            <p>Your email is: {user.email}</p>
            {/* ... other dashboard content */}
        </div>
    );
};

export default Dashboard;