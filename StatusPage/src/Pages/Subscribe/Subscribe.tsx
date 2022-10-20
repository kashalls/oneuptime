import React, { FunctionComponent, ReactElement } from 'react';
import PageComponentProps from '../PageComponentProps';
import Page from '../../Components/Page/Page';

const PageNotFound: FunctionComponent<PageComponentProps> = (
    _props: PageComponentProps
): ReactElement => {
    return (
        <Page>
            <p>Subscribe.</p>
        </Page>
    );
};

export default PageNotFound;
