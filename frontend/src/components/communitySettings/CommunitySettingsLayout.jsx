import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './communitySettingsLayout.module.css';
import CommunitySettingsNav from './CommunitySettingsNav';
import CommunityInfoPanel from './CommunityInfoPanel';
import MembersTab from './membersTab';
import RequestsTab from './requestsTab';
import CommunityPosts from './CommunityPosts';
import DeleteCommunityModal from './deleteCommunityModal';

export default function CommunitySettingsLayout({ community }) {
    const [activeTab, setActiveTab] = useState('Settings');
    const [prevTab, setPrevTab] = useState('Settings');

    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("access");
    const API = "http://localhost:8000";

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
                navigate('/communities');
            } else {
                console.error("Failed to delete community");
            }
        } catch (err) {
            console.error("Error deleting community:", err);
        }
    };

    const displayedTab = activeTab === 'Delete' ? prevTab : activeTab;
    const communityId = id || community?.id;

    return (
        <div className={styles.layoutContainer}>
            <CommunitySettingsNav activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className={styles.mainContent}>
                {(displayedTab === 'Settings' || displayedTab === 'Community info') && (
                    <CommunityInfoPanel community={community} />
                )}

                {displayedTab === 'Members' && (
                    <MembersTab
                        communityId={communityId}
                        onBack={() => setActiveTab('Community info')}
                    />
                )}

                {displayedTab === 'Requests' && (
                    <RequestsTab
                        groupId={communityId}
                        token={token}
                        onBack={() => setActiveTab('Community info')}
                        isPublic={community?.isPublic !== false}
                    />
                )}

                {displayedTab === 'Posts' && (
                    <CommunityPosts
                        communityId={communityId}
                        onBack={() => setActiveTab('Community info')}
                    />
                )}
            </div>

            {activeTab === 'Delete' && (
                <DeleteCommunityModal
                    isOpen={true}
                    onClose={() => setActiveTab(prevTab)}
                    onDelete={handleDeleteCommunity}
                />
            )}
        </div>
    );
}