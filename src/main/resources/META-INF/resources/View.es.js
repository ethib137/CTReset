import Component from 'metal-component/src/Component';
import Soy from 'metal-soy/src/Soy';
import templates from './View.soy';

/**
 * View Component
 */
class View extends Component {
	created() {
		console.log('created', this);

		this._getSegmentUsers = this._getSegmentUsers.bind(this);
		this._handlesScoreInput = this._handlesScoreInput.bind(this);

		this._siteGroupId = themeDisplay.getSiteGroupId();

		this._getSegments();
	}

	_getScorePoints(selectedSegmentIndex) {
		const instance = this;

		if (instance.segments) {
			Liferay.Service(
				'/ct_scorepoints.scorepoint/get-score-points',
				{
					userSegmentId: instance.segments[selectedSegmentIndex].userSegmentId
				},
				function(segmentUsers) {
					const segmentsMap = {};

					segmentUsers.forEach(
						segmentUser => {
							segmentsMap[segmentUser.anonymousUserId] = segmentUser.points;
						}
					);

					instance.segmentUsers = instance.segmentUsers.map(
						segment => {
							segment.points = segmentsMap[segment.anonymousUserId];

							return segment;
						}
					);
				}
			);
		}
	}

	_getSegments() {
		const instance = this;

		Liferay.Service(
			'/ct.usersegment/get-user-segments',
			{
				groupId: this._siteGroupId
			},
			function(segments) {
				instance.segments = segments;
			}
		);
	}

	_getSegmentUsers(selectedSegmentIndex, active) {
		const instance = this;

		Liferay.Service(
			'/ct.anonymoususerusersegment/get-anonymous-users-by-user-segment-id',
			{
				active,
				userSegmentId: this.segments[selectedSegmentIndex].userSegmentId
			},
			function(segmentUsers) {
				instance.segmentUsers = segmentUsers;

				instance.selectedSegmentUserIndex = -1;

				console.log('instance.selectedSegmentUserIndex:', instance.selectedSegmentUserIndex);
			}
		);
	}

	_handleActiveUsersChange(event) {
		this.activeUsers = !this.activeUsers;

		this._getSegmentUsers(this.selectedSegmentIndex, this.activeUsers);
	}

	_handlesScoreInput(event) {
		this.score = parseInt(event.delegateTarget.value);
	}

	_handleSegmentSelect(event) {
		this.selectedSegmentIndex = event.delegateTarget.value;

		this._getSegmentUsers(this.selectedSegmentIndex, this.activeUsers);
	}

	_handleSegmentUserSelect(event) {
		this.selectedSegmentUserIndex = event.delegateTarget.value;
	}

	_handleUpdateScorePoints() {
		const instance = this;

		Liferay.Service(
			'/ct_scorepoints.scorepoint/update-score-points',
			{
				anonymousUserId: instance.segmentUsers[instance.selectedSegmentUserIndex].anonymousUserId,
				userSegmentId: instance.segments[instance.selectedSegmentIndex].userSegmentId,
				points: instance.score
			},
			function(obj) {
				instance._getSegmentUsers(instance.selectedSegmentIndex, instance.activeUsers);
			}
		);
	}

	syncSegmentUsers(newVal, oldVal) {
		if (JSON.stringify(newVal) != JSON.stringify(oldVal)) {
			this._getScorePoints(this.selectedSegmentIndex);
		}
	}
}

View.STATE = {
	activeUsers: {
		value: true
	},
	score: {
		value: 0
	},
	segments: {},
	segmentUsers: {},
	selectedSegmentIndex: {},
	selectedSegmentUserIndex: {}
}

// Register component
Soy.register(View, templates);

export default View;