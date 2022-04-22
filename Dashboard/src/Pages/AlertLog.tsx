import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import { Fade } from 'react-awesome-reveal';
import { fetchAlert, fetchProjectAlert } from '../actions/alert';
import PropTypes from 'prop-types';
import AlertProjectBox from '../components/alert/AlertProjectBox';
import RenderIfUserInSubProject from '../components/basic/RenderIfUserInSubProject';

import { v4 as uuidv4 } from 'uuid';

import BreadCrumbItem from '../components/breadCrumb/BreadCrumbItem';
import getParentRoute from '../Utils/getParentRoute';
import { LoadingState } from '../components/basic/Loader';
import ShouldRender from '../components/basic/ShouldRender';

interface AlertLogProps {
    fetchAlert?: Function;
    fetchProjectAlert?: Function;
    currentProject: object;
    alerts?: object;
    error?: object;
    isRequesting?: boolean;
    subProjects: unknown[];
    location?: {
        pathname?: string
    };
    switchToProjectViewerNav?: boolean;
    activeProjectId?: string;
}

class AlertLog extends Component<ComponentProps> {
    constructor(props: $TSFixMe) {
        super(props);
        this.state = {};
    }
    override componentDidMount() {

        if (this.props?.activeProjectId) {
            this.ready();
        }
    }

    componentDidUpdate(prevProps: $TSFixMe) {

        if (prevProps?.activeProjectId !== this.props?.activeProjectId) {
            this.ready();
        }
    }

    ready = () => {

        this.props.fetchAlert(this.props.activeProjectId);
    };

    prevClicked = (projectId: string, skip: PositiveNumber, limit: PositiveNumber) => {

        this.props.fetchProjectAlert(
            projectId,
            (skip || 0) > (limit || 10) ? skip - limit : 0,
            10
        );

        this.setState({ [projectId]: this.state[projectId] - 1 });
    };

    nextClicked = (projectId: string, skip: PositiveNumber, limit: PositiveNumber) => {

        this.props.fetchProjectAlert(projectId, skip + limit, 10);
        this.setState({

            [projectId]: !this.state[projectId] ? 2 : this.state[projectId] + 1,
        });
    };

    override render() {
        const {

            subProjects,

            currentProject,

            isRequesting,

            error,

            location: { pathname },

            switchToProjectViewerNav,

            activeProjectId,
        } = this.props;

        // Add Project Alerts to All Alerts List
        let projectAlert =

            this.props.alerts.data &&

            this.props.alerts.data.length > 0 &&

            this.props.alerts.data.find(
                (projectAlert: $TSFixMe) => projectAlert._id === activeProjectId
            );
        if (
            projectAlert &&
            projectAlert.count &&
            typeof projectAlert.count === 'string'
        ) {
            projectAlert.count = parseInt(projectAlert.count, 10);
        }
        if (
            projectAlert &&
            projectAlert.skip &&
            typeof projectAlert.skip === 'string'
        ) {
            projectAlert.skip = parseInt(projectAlert.skip, 10);
        }
        if (
            projectAlert &&
            projectAlert.limit &&
            typeof projectAlert.limit === 'string'
        ) {
            projectAlert.limit = parseInt(projectAlert.limit, 10);
        }
        let canNext =
            projectAlert &&
                projectAlert.count &&
                projectAlert.count > projectAlert.skip + projectAlert.limit
                ? true
                : false;
        let canPrev = projectAlert && projectAlert.skip <= 0 ? false : true;

        if (

            this.props.alerts &&

            (this.props.alerts.requesting || !this.props.alerts.data)
        ) {
            canNext = false;
            canPrev = false;
        }

        const subProjectName: $TSFixMe =
            subProjects.find((obj: $TSFixMe) => obj._id === activeProjectId)?.name ||
            currentProject.name;
        projectAlert =
            projectAlert && projectAlert.alerts ? (
                <RenderIfUserInSubProject
                    subProjectId={projectAlert._id}

                    key={() => uuidv4()}
                >
                    <div className="bs-BIM">
                        <div className="Box-root Margin-bottom--12">
                            <div className="bs-ContentSection Card-root Card-shadow--medium">
                                <AlertProjectBox
                                    subProjectAlert={projectAlert}
                                    subProjectName={subProjectName}
                                    showProjectName={
                                        currentProject?._id !== activeProjectId
                                    }
                                    currentProjectId={activeProjectId}
                                    prevClicked={this.prevClicked}
                                    nextClicked={this.nextClicked}
                                    canNext={canNext}
                                    canPrev={canPrev}
                                    isRequesting={isRequesting}
                                    error={error}

                                    subProjects={subProjects}

                                    pages={this.state[activeProjectId]}
                                />
                            </div>
                        </div>
                    </div>
                </RenderIfUserInSubProject>
            ) : (
                false
            );
        const allAlerts: $TSFixMe = projectAlert && [projectAlert];
        const projectName: $TSFixMe = currentProject ? currentProject.name : '';
        const projectId: $TSFixMe = activeProjectId;
        return (
            <Fade>
                <BreadCrumbItem
                    route="/"
                    name={projectName}
                    projectId={projectId || ''}
                    slug={currentProject ? currentProject.slug : null}

                    switchToProjectViewerNav={switchToProjectViewerNav}
                />
                <BreadCrumbItem

                    route={getParentRoute(pathname)}
                    name="On-Call Duty"
                />
                <BreadCrumbItem route={pathname} name="Alert Log" />

                <ShouldRender if={!this.props.isRequesting}>
                    <div className="Box-root">
                        <div>
                            <div>
                                <div
                                    id="alertLogPage"
                                    className="Margin-vertical--12"
                                >
                                    {allAlerts}
                                </div>
                            </div>
                        </div>
                    </div>
                </ShouldRender>

                <ShouldRender if={this.props.isRequesting}>
                    <LoadingState />
                </ShouldRender>
            </Fade>
        );
    }
}

const mapDispatchToProps: Function = (dispatch: Dispatch) => bindActionCreators({ fetchAlert, fetchProjectAlert }, dispatch);

const mapStateToProps: Function = (state: RootState) => {
    let subProjects = state.subProject.subProjects.subProjects;

    // sort subprojects names for display in alphabetical order
    const subProjectNames: $TSFixMe =
        subProjects && subProjects.map((subProject: $TSFixMe) => subProject.name);
    subProjectNames && subProjectNames.sort();
    subProjects =
        subProjectNames &&
        subProjectNames.map((name: $TSFixMe) => subProjects.find((subProject: $TSFixMe) => subProject.name === name)
        );
    return {
        alerts: state.alert.alerts,
        isRequesting: state.alert.alerts.requesting,
        error: state.alert.alerts.error,
        currentProject: state.project.currentProject,
        subProjects,
        switchToProjectViewerNav: state.project.switchToProjectViewerNav,
        activeProjectId: state.subProject.activeSubProject,
    };
};


AlertLog.propTypes = {
    fetchAlert: PropTypes.func,
    fetchProjectAlert: PropTypes.func,
    currentProject: PropTypes.object.isRequired,
    alerts: PropTypes.object,
    error: PropTypes.object,
    isRequesting: PropTypes.bool,
    subProjects: PropTypes.array.isRequired,
    location: PropTypes.shape({
        pathname: PropTypes.string,
    }),
    switchToProjectViewerNav: PropTypes.bool,
    activeProjectId: PropTypes.string,
};


AlertLog.displayName = 'AlertLog';

export default connect(mapStateToProps, mapDispatchToProps)(AlertLog);