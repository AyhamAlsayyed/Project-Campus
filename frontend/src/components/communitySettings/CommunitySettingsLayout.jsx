import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './communitySettingsLayout.module.css';
import CommunitySettingsNav from './CommunitySettingsNav';
import CommunityInfoPanel from './CommunityInfoPanel';
import MembersTab from './membersTab';
import requestsTab from './requestsTab'; // Note: update casing if needed to match file name
import DeleteCommunityModal from './deleteCommunityModal'; 

export default function CommunitySettingsLayout({ community }) {
    const [activeTab, setActiveTab] = useState('Settings');
    const [prevTab, setPrevTab] = useState('Settings');

    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("access");
    const API = "http://localhost:8000";

    // Track the last active tab that wasn't 'Delete' to keep as the background view
    useEffect(() => {
        if (activeTab !== 'Delete') {
            setPrevTab(activeTab);
        }
    }, [activeTab]);

    const handleDeleteCommunity = async () => {
        try {
            const res = await fetch(`${API}/api/communities/${id || community?.id}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                navigate('/communities'); // Route away after successful deletion
            } else {
                console.error("Failed to delete community");
            }
        } catch (err) {
            console.error("Error deleting community:", err);
        }
    };

    // Decide which panel to display in the background context
    const displayedTab = activeTab === 'Delete' ? prevTab : activeTab;

    return (
        <div className={styles.layoutContainer}>
            {/* The Sidebar Nav on the right */}
            <CommunitySettingsNav activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* The Main Content area on the left */}
            <div className={styles.mainContent}>
                {/* 1. Show Info Panel when state is 'Settings' OR explicitly clicked to 'Community info' */}
                {(displayedTab === 'Settings' || displayedTab === 'Community info') && (
                    <CommunityInfoPanel community={community} />
                )}
                
                {displayedTab === 'Members' && (
                    <MembersTab 
                        communityId={id || community?.id} 
                        onBack={() => setActiveTab('Community info')} 
                    />
                )}

                {displayedTab === 'Requests' && (
                    <div style={{ padding: '32px', color: '#808080' }}>Requests Panel Coming Soon...</div>
                )}
                
                {displayedTab === 'Posts' && (
                    <div style={{ padding: '32px', color: '#808080' }}>Posts Panel Coming Soon...</div>
                )}
            </div>

            {/* ── STANDALONE OVERLAY MODAL LAYER ── */}
            {activeTab === 'Delete' && (
                <DeleteCommunityModal
                    isOpen={true}
                    onClose={() => setActiveTab(prevTab)} // Drops back to whatever view they were looking at
                    onDelete={handleDeleteCommunity}
                />
            )}
        </div>
    );
}