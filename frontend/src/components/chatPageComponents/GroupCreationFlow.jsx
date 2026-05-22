import React, { useState } from 'react';
import CreateGroup from './creategroup';
import AddMembers from './addmembers';

export default function GroupCreationFlow({ closeFlow, currentUser }) {
    const [currentStep, setCurrentStep] = useState('create');

    const handleFlowComplete = (selectedMembers) => {
        console.log("Finished! Selected member IDs:", selectedMembers);
        if (closeFlow) closeFlow();
    };

    return (
        <>
            {currentStep === 'create' && (
                <CreateGroup
                    onBack={closeFlow}
                    onCreate={() => setCurrentStep('addMembers')}
                    isInstructor={currentUser?.role === 'instructor' || currentUser?.role === 'admin'}
                />
            )}

            {currentStep === 'addMembers' && (
                <AddMembers
                    onBack={() => setCurrentStep('create')}
                    onDone={handleFlowComplete}
                />
            )}
        </>
    );
}