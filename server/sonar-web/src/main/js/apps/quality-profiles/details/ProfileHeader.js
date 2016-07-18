/*
 * SonarQube
 * Copyright (C) 2009-2016 SonarSource SA
 * mailto:contact AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import React from 'react';
import { Link, IndexLink } from 'react-router';
import classNames from 'classnames';
import ProfileLink from '../components/ProfileLink';
import ProfileActions from '../components/ProfileActions';
import ProfileDate from '../components/ProfileDate';
import { ProfileType } from '../propTypes';
import { translate } from '../../../helpers/l10n';
import { isStagnant } from '../utils';

export default class ProfileHeader extends React.Component {
  static propTypes = {
    profile: ProfileType.isRequired,
    canAdmin: React.PropTypes.bool.isRequired,
    updateProfiles: React.PropTypes.func.isRequired
  };

  renderUpdateDate () {
    const { profile } = this.props;
    const warning = isStagnant(profile);
    const className = classNames('small spacer-right', {
      'alert-warning': warning
    });
    return (
        <li className={className}>
          {translate('quality_profiles.updated_')}
          {' '}
          <ProfileDate date={profile.userUpdatedAt}/>
        </li>
    );
  }

  renderUsageDate () {
    const { profile } = this.props;
    const warning = !profile.lastUsed;
    const className = classNames('small big-spacer-right', {
      'alert-warning': warning
    });
    return (
        <li className={className}>
          {translate('quality_profiles.used_')}
          {' '}
          <ProfileDate date={profile.lastUsed}/>
        </li>
    );
  }

  render () {
    const { profile } = this.props;

    return (
        <header className="page-header quality-profile-header">
          <div className="note spacer-bottom">
            <IndexLink to="/" className="text-muted">
              {translate('quality_profiles.page')}
            </IndexLink>
            {' / '}
            <Link
                to={{ pathname: '/', query: { language: profile.language } }}
                className="text-muted">
              {profile.languageName}
            </Link>
          </div>

          <h1 className="page-title">
            <ProfileLink
                profileKey={profile.key}
                className="link-base-color">
              {profile.name}
            </ProfileLink>
          </h1>

          <div className="pull-right">
            <ul className="list-inline" style={{ lineHeight: '24px' }}>
              {this.renderUpdateDate()}
              {this.renderUsageDate()}
              <li>
                <Link
                    to={{ pathname: '/changelog', query: { key: profile.key } }}
                    className="button">
                  {translate('changelog')}
                </Link>
              </li>
              <li>
                <div className="pull-left dropdown">
                  <button className="dropdown-toggle"
                          data-toggle="dropdown">
                    {translate('actions')}
                    {' '}
                    <i className="icon-dropdown"/>
                  </button>
                  <ProfileActions
                      profile={profile}
                      canAdmin={this.props.canAdmin}
                      updateProfiles={this.props.updateProfiles}/>
                </div>
              </li>
            </ul>
          </div>
        </header>
    );
  }
}
