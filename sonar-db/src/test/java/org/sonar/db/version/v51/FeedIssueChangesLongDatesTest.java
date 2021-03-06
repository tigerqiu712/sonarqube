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
package org.sonar.db.version.v51;

import org.junit.Rule;
import org.junit.Test;
import org.sonar.api.utils.System2;
import org.sonar.db.DbTester;
import org.sonar.db.version.MigrationStep;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class FeedIssueChangesLongDatesTest {
  @Rule
  public DbTester db = DbTester.createForSchema(System2.INSTANCE, FeedIssueChangesLongDatesTest.class, "schema.sql");

  @Test
  public void execute() throws Exception {
    db.prepareDbUnit(getClass(), "before.xml");

    System2 system = mock(System2.class);
    when(system.now()).thenReturn(1500000000000L);
    MigrationStep migration = new FeedIssueChangesLongDates(db.database(), system);
    migration.execute();

    int count = db.countSql("select count(1) from issue_changes where created_at_ms is not null and updated_at_ms is not null");
    assertThat(count).isEqualTo(3);

    int countWithAllDateFieldsNull = db
      .countSql("select count(1) from issue_changes where created_at_ms is not null and updated_at_ms is not null and issue_change_creation_date_ms is not null");
    assertThat(countWithAllDateFieldsNull).isEqualTo(2);
  }
}
