import React from 'react';
import OaOverview from './OaOverview';
import { Redirect, useParams } from 'react-router-dom';

function DemoView () {
    let { filename } = useParams()
    var elementsToShow = <OaOverview demo={true} />
    if (!filename) {
        elementsToShow = <Redirect to='/demo/TIs4K0RoB.pdf' />
    }
    return elementsToShow
}

export default DemoView;
