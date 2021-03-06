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
package org.sonar.server.computation.step;

import org.sonar.db.DbClient;
import org.sonar.db.DbSession;
import org.sonar.db.MyBatis;
import org.sonar.server.computation.analysis.AnalysisMetadataHolder;
import org.sonar.server.computation.component.Component;
import org.sonar.server.computation.component.TreeRootHolder;

public class EnableAnalysisStep implements ComputationStep {

  private final DbClient dbClient;
  private final TreeRootHolder treeRootHolder;
  private final AnalysisMetadataHolder analysisMetadataHolder;

  public EnableAnalysisStep(DbClient dbClient, TreeRootHolder treeRootHolder, AnalysisMetadataHolder analysisMetadataHolder) {
    this.dbClient = dbClient;
    this.treeRootHolder = treeRootHolder;
    this.analysisMetadataHolder = analysisMetadataHolder;
  }

  @Override
  public void execute() {
    DbSession dbSession = dbClient.openSession(false);
    try {
      Component project = treeRootHolder.getRoot();
      dbClient.snapshotDao().switchIsLastFlagAndSetProcessedStatus(dbSession, project.getUuid(), analysisMetadataHolder.getUuid());
      dbClient.componentDao().applyBChangesForRootComponentUuid(dbSession, project.getUuid());
      dbSession.commit();

    } finally {
      MyBatis.closeQuietly(dbSession);
    }
  }

  @Override
  public String getDescription() {
    return "Enable analysis";
  }

}
