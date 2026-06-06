import React, { useState } from 'react';
import CreateGroup from './creategroup';
import AddMembers from './addmembers';

const API = 'http://localhost:8000';

export default function GroupCreationFlow({ closeFlow, currentUser }) {
    const [currentStep, setCurrentStep] = useState('create');
    const [pendingGroupData, setPendingGroupData] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    const token = localStorage.getItem('access');
    const isInstructor = currentUser?.role === 'instructor' || currentUser?.role === 'admin';

    // Step 1 done — store form data, move to member selection
    const handleProceedToMembers = (formData) => {
        setPendingGroupData(formData);
        setCurrentStep('addMembers');
    };

    // Step 2 done — fire the actual API with everything combined
    const handleMembersDone = async (memberIds) => {
        if (!pendingGroupData || isCreating) return;
        setIsCreating(true);
        setCreateError('');

        try {
            // 1. Create the group
            const res = await fetch(`${API}/api/groups/create/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: pendingGroupData.name,
                    description: pendingGroupData.description,
                    is_academic: pendingGroupData.isAcademic,
                    members: memberIds,
                    permissions: {
                        editSettings: pendingGroupData.canEditSettings,
                        sendMessages: pendingGroupData.canSendMessages,
                        addMembers: pendingGroupData.canAddMembers,
                        approveMembers: pendingGroupData.requireApproval,
                    },
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || err.detail || 'Failed to create group');
            }

            const newGroup = await res.json();
            const groupId = newGroup.conversation_id;

            // 2. Upload image if user picked one
            if (pendingGroupData.groupImageFile && groupId) {
                const formData = new FormData();
                formData.append('image', pendingGroupData.groupImageFile);
                await fetch(`${API}/api/groups/${groupId}/edit-image/`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });
            }

            // Done
            setPendingGroupData(null);
            if (closeFlow) closeFlow(newGroup);

        } catch (err) {
            console.error('Group creation failed:', err);
            setCreateError(err.message);
            // Stay on addMembers so user can retry, don't lose their selection
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            {currentStep === 'create' && (
                <CreateGroup
                    onBack={closeFlow}
                    onProceedToMembers={handleProceedToMembers}
                    isInstructor={isInstructor}
                    API={API}
                    token={token}
                />
            )}

            {currentStep === 'addMembers' && (
                <AddMembers
                    createMode={true}
                    onBack={() => setCurrentStep('create')}
                    onDone={handleMembersDone}
                    isCreating={isCreating}
                    createError={createError}
                    API={API}
                    token={token}
                />
            )}
        </>
    );
}