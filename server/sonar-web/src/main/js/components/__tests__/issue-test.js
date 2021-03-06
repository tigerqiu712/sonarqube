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
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import Issue from '../issue/models/issue';

chai.use(sinonChai);

describe('Issue', function () {
  describe('Model', function () {
    it('should have correct urlRoot', function () {
      const issue = new Issue();
      expect(issue.urlRoot()).to.equal('/api/issues');
    });

    it('should parse response without root issue object', function () {
      const issue = new Issue();
      const example = { a: 1 };
      expect(issue.parse(example)).to.deep.equal(example);
    });

    it('should parse response with the root issue object', function () {
      const issue = new Issue();
      const example = { a: 1 };
      expect(issue.parse({ issue: example })).to.deep.equal(example);
    });

    it('should reset attributes (no attributes initially)', function () {
      const issue = new Issue();
      const example = { a: 1 };
      issue.reset(example);
      expect(issue.toJSON()).to.deep.equal(example);
    });

    it('should reset attributes (override attribute)', function () {
      const issue = new Issue({ a: 2 });
      const example = { a: 1 };
      issue.reset(example);
      expect(issue.toJSON()).to.deep.equal(example);
    });

    it('should reset attributes (different attributes)', function () {
      const issue = new Issue({ a: 2 });
      const example = { b: 1 };
      issue.reset(example);
      expect(issue.toJSON()).to.deep.equal(example);
    });

    it('should unset `textRange` of a closed issue', function () {
      const issue = new Issue();
      const result = issue.parse({ issue: { status: 'CLOSED', textRange: { startLine: 5 } } });
      expect(result.textRange).to.not.be.ok;
    });

    it('should unset `flows` of a closed issue', function () {
      const issue = new Issue();
      const result = issue.parse({ issue: { status: 'CLOSED', flows: [1, 2, 3] } });
      expect(result.flows).to.deep.equal([]);
    });

    describe('Actions', function () {
      it('should assign', function () {
        const issue = new Issue({ key: 'issue-key' });
        const spy = sinon.spy();
        issue._action = spy;
        issue.assign('admin');
        expect(spy).to.have.been.calledWith({
          data: { assignee: 'admin', issue: 'issue-key' },
          url: '/api/issues/assign'
        });
      });

      it('should unassign', function () {
        const issue = new Issue({ key: 'issue-key' });
        const spy = sinon.spy();
        issue._action = spy;
        issue.assign();
        expect(spy).to.have.been.calledWith({
          data: { assignee: undefined, issue: 'issue-key' },
          url: '/api/issues/assign'
        });
      });

      it('should plan', function () {
        const issue = new Issue({ key: 'issue-key' });
        const spy = sinon.spy();
        issue._action = spy;
        issue.plan('plan');
        expect(spy).to.have.been.calledWith({ data: { plan: 'plan', issue: 'issue-key' }, url: '/api/issues/plan' });
      });

      it('should unplan', function () {
        const issue = new Issue({ key: 'issue-key' });
        const spy = sinon.spy();
        issue._action = spy;
        issue.plan();
        expect(spy).to.have.been.calledWith({ data: { plan: undefined, issue: 'issue-key' }, url: '/api/issues/plan' });
      });

      it('should set severity', function () {
        const issue = new Issue({ key: 'issue-key' });
        const spy = sinon.spy();
        issue._action = spy;
        issue.setSeverity('BLOCKER');
        expect(spy).to.have.been.calledWith({
          data: { severity: 'BLOCKER', issue: 'issue-key' },
          url: '/api/issues/set_severity'
        });
      });
    });

    describe('#getLinearLocations', function () {
      it('should return single line location', function () {
        const issue = new Issue({ textRange: { startLine: 1, endLine: 1, startOffset: 0, endOffset: 10 } });
        const locations = issue.getLinearLocations();
        expect(locations.length).to.equal(1);

        expect(locations[0].line).to.equal(1);
        expect(locations[0].from).to.equal(0);
        expect(locations[0].to).to.equal(10);
      });

      it('should return location not from 0', function () {
        const issue = new Issue({ textRange: { startLine: 1, endLine: 1, startOffset: 5, endOffset: 10 } });
        const locations = issue.getLinearLocations();
        expect(locations.length).to.equal(1);

        expect(locations[0].line).to.equal(1);
        expect(locations[0].from).to.equal(5);
        expect(locations[0].to).to.equal(10);
      });

      it('should return 2-lines location', function () {
        const issue = new Issue({ textRange: { startLine: 2, endLine: 3, startOffset: 5, endOffset: 10 } });
        const locations = issue.getLinearLocations();
        expect(locations.length).to.equal(2);

        expect(locations[0].line).to.equal(2);
        expect(locations[0].from).to.equal(5);
        expect(locations[0].to).to.equal(999999);

        expect(locations[1].line).to.equal(3);
        expect(locations[1].from).to.equal(0);
        expect(locations[1].to).to.equal(10);
      });

      it('should return 3-lines location', function () {
        const issue = new Issue({ textRange: { startLine: 4, endLine: 6, startOffset: 5, endOffset: 10 } });
        const locations = issue.getLinearLocations();
        expect(locations.length).to.equal(3);

        expect(locations[0].line).to.equal(4);
        expect(locations[0].from).to.equal(5);
        expect(locations[0].to).to.equal(999999);

        expect(locations[1].line).to.equal(5);
        expect(locations[1].from).to.equal(0);
        expect(locations[1].to).to.equal(999999);

        expect(locations[2].line).to.equal(6);
        expect(locations[2].from).to.equal(0);
        expect(locations[2].to).to.equal(10);
      });

      it('should return [] when no location', function () {
        const issue = new Issue();
        const locations = issue.getLinearLocations();
        expect(locations.length).to.equal(0);
      });
    });
  });
});
