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
package org.sonar.server.user.ws;

import com.google.common.collect.Sets;
import java.util.Set;
import org.sonar.api.server.ws.Request;
import org.sonar.api.server.ws.Response;
import org.sonar.api.server.ws.WebService;
import org.sonar.api.utils.text.JsonWriter;
import org.sonar.core.permission.GlobalPermissions;
import org.sonar.db.DbClient;
import org.sonar.db.DbSession;
import org.sonar.db.user.UserDto;
import org.sonar.server.exceptions.NotFoundException;
import org.sonar.server.user.UpdateUser;
import org.sonar.server.user.UserSession;
import org.sonar.server.user.UserUpdater;

import static com.google.common.base.Strings.emptyToNull;
import static java.lang.String.format;
import static java.util.Collections.singletonList;

public class UpdateAction implements UsersWsAction {

  private static final String PARAM_LOGIN = "login";
  private static final String PARAM_NAME = "name";
  private static final String PARAM_EMAIL = "email";
  private static final String PARAM_SCM_ACCOUNTS = "scmAccounts";
  private static final String PARAM_SCM_ACCOUNTS_DEPRECATED = "scm_accounts";

  private final UserUpdater userUpdater;
  private final UserSession userSession;
  private final UserJsonWriter userWriter;
  private final DbClient dbClient;

  public UpdateAction(UserUpdater userUpdater, UserSession userSession, UserJsonWriter userWriter, DbClient dbClient) {
    this.userUpdater = userUpdater;
    this.userSession = userSession;
    this.userWriter = userWriter;
    this.dbClient = dbClient;
  }

  @Override
  public void define(WebService.NewController controller) {
    WebService.NewAction action = controller.createAction("update")
      .setDescription("Update a user. If a deactivated user account exists with the given login, it will be reactivated. " +
        "Requires Administer System permission. Since 5.2, a user's password can only be changed using the 'change_password' action.")
      .setSince("3.7")
      .setPost(true)
      .setHandler(this)
      .setResponseExample(getClass().getResource("example-update.json"));

    action.createParam(PARAM_LOGIN)
      .setDescription("User login")
      .setRequired(true)
      .setExampleValue("myuser");

    action.createParam(PARAM_NAME)
      .setDescription("User name")
      .setExampleValue("My Name");

    action.createParam(PARAM_EMAIL)
      .setDescription("User email")
      .setExampleValue("myname@email.com");

    action.createParam(PARAM_SCM_ACCOUNTS)
      .setDescription("SCM accounts. This parameter has been added in 5.1")
      .setDeprecatedKey(PARAM_SCM_ACCOUNTS_DEPRECATED)
      .setExampleValue("myscmaccount1,myscmaccount2");
  }

  @Override
  public void handle(Request request, Response response) throws Exception {
    userSession.checkLoggedIn().checkPermission(GlobalPermissions.SYSTEM_ADMIN);

    String login = request.mandatoryParam(PARAM_LOGIN);
    UpdateUser updateUser = UpdateUser.create(login);
    if (request.hasParam(PARAM_NAME)) {
      updateUser.setName(request.mandatoryParam(PARAM_NAME));
    }
    if (request.hasParam(PARAM_EMAIL)) {
      updateUser.setEmail(emptyToNull(request.param(PARAM_EMAIL)));
    }
    if (request.hasParam(PARAM_SCM_ACCOUNTS) || request.hasParam(PARAM_SCM_ACCOUNTS_DEPRECATED)) {
      updateUser.setScmAccounts(request.paramAsStrings(PARAM_SCM_ACCOUNTS));
    }

    userUpdater.update(updateUser);
    writeResponse(response, login);
  }

  private void writeResponse(Response response, String login) {
    JsonWriter json = response.newJsonWriter().beginObject();
    writeUser(json, login);
    json.endObject().close();
  }

  private void writeUser(JsonWriter json, String login) {
    json.name("user");
    Set<String> groups = Sets.newHashSet();
    DbSession dbSession = dbClient.openSession(false);
    try {
      UserDto user = dbClient.userDao().selectByLogin(dbSession, login);
      if (user == null) {
        throw new NotFoundException(format("User '%s' doesn't exist", login));
      }
      groups.addAll(dbClient.groupMembershipDao().selectGroupsByLogins(dbSession, singletonList(login)).get(login));
      userWriter.write(json, user, groups, UserJsonWriter.FIELDS);
    } finally {
      dbClient.closeSession(dbSession);
    }
  }
}
